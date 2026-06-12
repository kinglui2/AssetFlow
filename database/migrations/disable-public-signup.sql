-- =============================================================================
-- Migration: Disable public self-registration
-- =============================================================================
-- AssetFlow accounts must be created by an ICT Administrator via the
-- create-user Edge Function (or Supabase Dashboard during initial setup).
--
-- AFTER running this migration, also disable sign-ups in Supabase Dashboard:
--   Authentication → Providers → Email → turn OFF "Enable sign ups"
-- =============================================================================

-- Step 1: Grandfather all existing auth users so current admins/officers/staff
--         are not locked out. Skip this if you intentionally want to remove
--         specific self-registered accounts first (see Step 4).
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
  || jsonb_build_object('provisioned_by_admin', true)
WHERE COALESCE(raw_user_meta_data->>'provisioned_by_admin', 'false') <> 'true';

-- Step 2: Block profile creation for any future auth user not provisioned by an admin.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF COALESCE(NEW.raw_user_meta_data->>'provisioned_by_admin', 'false') <> 'true' THEN
    RAISE EXCEPTION 'Public registration is disabled. Contact an ICT administrator for an account.';
  END IF;

  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'officer')::user_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Step 3: Ensure the trigger is attached (safe to re-run).
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 4 (OPTIONAL): Remove accounts that were created via public self-signup
--         before this migration. Review the list before deleting.
--
-- Preview self-registered accounts (no admin provision flag, not yet grandfathered):
--   SELECT u.id, u.email, u.created_at, p.role, p.full_name
--   FROM auth.users u
--   JOIN public.profiles p ON p.id = u.id
--   WHERE COALESCE(u.raw_user_meta_data->>'provisioned_by_admin', 'false') <> 'true';
--
-- Delete self-registered accounts (profiles cascade via FK on auth.users):
--   DELETE FROM auth.users u
--   WHERE COALESCE(u.raw_user_meta_data->>'provisioned_by_admin', 'false') <> 'true';
