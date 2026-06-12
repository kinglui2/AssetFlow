-- =============================================================================
-- AssetFlow — Supabase Database Setup
-- =============================================================================
--
-- HOW TO USE:
--   1. Open your Supabase project dashboard
--   2. Go to SQL Editor → New query
--   3. Run each STEP below one at a time (or run the entire file on a fresh project)
--   4. After all steps, complete STEP 11 to create your first admin user
--
-- PREREQUISITE: A new/empty Supabase project (or drop existing AssetFlow objects first)
--
-- =============================================================================


-- =============================================================================
-- STEP 1: Create custom enum types
-- =============================================================================

CREATE TYPE user_role AS ENUM ('admin', 'officer', 'staff');

CREATE TYPE equipment_status AS ENUM (
  'available',
  'borrowed',
  'assigned',
  'under_maintenance',
  'retired'
);

CREATE TYPE equipment_condition AS ENUM (
  'excellent',
  'good',
  'fair',
  'poor'
);

CREATE TYPE borrowing_status AS ENUM (
  'active',
  'returned',
  'overdue'
);

CREATE TYPE issuance_type AS ENUM (
  'temporary',
  'assignment'
);

CREATE TYPE borrow_request_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'cancelled'
);


-- =============================================================================
-- STEP 2: Create tables
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 2a. profiles — extends Supabase Auth users
-- -----------------------------------------------------------------------------
CREATE TABLE profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text NOT NULL,
  email       text NOT NULL UNIQUE,
  role        user_role NOT NULL DEFAULT 'officer',
  department  text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 2b. categories — equipment classification
-- -----------------------------------------------------------------------------
CREATE TABLE categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 2c. equipment — ICT asset inventory
-- -----------------------------------------------------------------------------
CREATE TABLE equipment (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  category_id   uuid NOT NULL REFERENCES categories(id),
  serial_number text UNIQUE,
  asset_tag     text UNIQUE,
  condition     equipment_condition NOT NULL DEFAULT 'good',
  status        equipment_status NOT NULL DEFAULT 'available',
  notes         text,
  created_by    uuid REFERENCES profiles(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 2d. borrowing_records — issuance and return tracking
-- -----------------------------------------------------------------------------
CREATE TABLE borrowing_records (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id         uuid NOT NULL REFERENCES equipment(id),
  issuance_type        issuance_type NOT NULL DEFAULT 'temporary',
  borrower_name        text NOT NULL,
  borrower_department  text NOT NULL,
  borrower_employee_id text,
  borrower_contact     text,
  purpose              text NOT NULL,
  status               borrowing_status NOT NULL DEFAULT 'active',
  borrowed_at          timestamptz NOT NULL DEFAULT now(),
  expected_return_at   timestamptz,
  returned_at          timestamptz,
  return_condition     equipment_condition,
  return_reason        text,
  issued_by            uuid NOT NULL REFERENCES profiles(id),
  returned_by          uuid REFERENCES profiles(id),
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 2e. audit_logs — immutable activity log
-- -----------------------------------------------------------------------------
CREATE TABLE audit_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES profiles(id),
  action      text NOT NULL,
  entity_type text,
  entity_id   uuid,
  details     jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 2f. borrow_requests — staff self-service equipment requests
-- -----------------------------------------------------------------------------
CREATE TABLE borrow_requests (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id         uuid NOT NULL REFERENCES profiles(id),
  requester_name       text NOT NULL,
  requester_department text,
  category_id          uuid REFERENCES categories(id),
  equipment_id         uuid REFERENCES equipment(id),
  purpose              text NOT NULL,
  needed_from          timestamptz,
  needed_until         timestamptz,
  status               borrow_request_status NOT NULL DEFAULT 'pending',
  reviewer_id          uuid REFERENCES profiles(id),
  reviewed_at          timestamptz,
  review_notes         text,
  borrowing_record_id  uuid REFERENCES borrowing_records(id),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 2g. app_settings — organization and system configuration (single row)
-- -----------------------------------------------------------------------------
CREATE TABLE app_settings (
  id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton                  boolean NOT NULL DEFAULT true UNIQUE CHECK (singleton = true),
  company_name               text NOT NULL DEFAULT 'Mirema School',
  company_tagline            text DEFAULT 'ICT Asset Inventory',
  company_email              text,
  company_phone              text,
  company_address            text,
  notify_new_borrow_requests boolean NOT NULL DEFAULT true,
  notify_overdue_returns     boolean NOT NULL DEFAULT true,
  notify_assignment_changes  boolean NOT NULL DEFAULT false,
  notification_email         text,
  default_borrow_days        integer NOT NULL DEFAULT 7 CHECK (default_borrow_days > 0),
  require_return_date        boolean NOT NULL DEFAULT false,
  asset_tag_prefix           text DEFAULT 'ICT',
  allow_staff_requests       boolean NOT NULL DEFAULT true,
  updated_at                 timestamptz NOT NULL DEFAULT now(),
  updated_by                 uuid REFERENCES profiles(id)
);


-- =============================================================================
-- STEP 3: Create indexes
-- =============================================================================

-- Equipment
CREATE INDEX idx_equipment_status    ON equipment(status);
CREATE INDEX idx_equipment_category  ON equipment(category_id);
CREATE INDEX idx_equipment_serial    ON equipment(serial_number);
CREATE INDEX idx_equipment_asset_tag ON equipment(asset_tag);

-- Borrowing
CREATE INDEX idx_borrowing_status      ON borrowing_records(status);
CREATE INDEX idx_borrowing_equipment   ON borrowing_records(equipment_id);
CREATE INDEX idx_borrowing_department  ON borrowing_records(borrower_department);
CREATE INDEX idx_borrowing_borrowed_at ON borrowing_records(borrowed_at);
CREATE INDEX idx_borrowing_active      ON borrowing_records(equipment_id)
  WHERE status = 'active';
CREATE INDEX idx_borrowing_issuance_type ON borrowing_records(issuance_type);

-- Audit logs
CREATE INDEX idx_audit_user       ON audit_logs(user_id);
CREATE INDEX idx_audit_action     ON audit_logs(action);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at);

-- Profiles
CREATE INDEX idx_profiles_role   ON profiles(role);
CREATE INDEX idx_profiles_active ON profiles(is_active);

-- Borrow requests
CREATE INDEX idx_borrow_requests_status      ON borrow_requests(status);
CREATE INDEX idx_borrow_requests_requester   ON borrow_requests(requester_id);
CREATE INDEX idx_borrow_requests_created_at  ON borrow_requests(created_at);


-- =============================================================================
-- STEP 4: Create helper functions
-- =============================================================================

-- Auto-update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Read the current user's role (bypasses RLS via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Auto-create profile when a new auth user is registered (admin-provisioned only)
CREATE OR REPLACE FUNCTION handle_new_user()
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

-- Sync equipment status when equipment is borrowed, assigned, or returned
CREATE OR REPLACE FUNCTION sync_equipment_on_borrow()
RETURNS TRIGGER AS $$
BEGIN
  -- On new issuance
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'active' THEN
      UPDATE public.equipment
      SET status = CASE
        WHEN NEW.issuance_type = 'assignment' THEN 'assigned'::equipment_status
        ELSE 'borrowed'::equipment_status
      END
      WHERE id = NEW.equipment_id;
    END IF;
    RETURN NEW;
  END IF;

  -- On issuance update (return or status change)
  IF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'active' AND OLD.status NOT IN ('active', 'overdue') THEN
      UPDATE public.equipment
      SET status = CASE
        WHEN NEW.issuance_type = 'assignment' THEN 'assigned'::equipment_status
        ELSE 'borrowed'::equipment_status
      END
      WHERE id = NEW.equipment_id;

    ELSIF NEW.status = 'returned' AND OLD.status IN ('active', 'overdue') THEN
      NEW.returned_at = COALESCE(NEW.returned_at, now());
      UPDATE public.equipment
      SET status = 'available'
      WHERE id = NEW.equipment_id;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Mark overdue borrowings (temporary only; assignments have no return date)
CREATE OR REPLACE FUNCTION mark_overdue_borrowings()
RETURNS integer AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE public.borrowing_records
  SET status = 'overdue'
  WHERE status = 'active'
    AND issuance_type = 'temporary'
    AND expected_return_at IS NOT NULL
    AND expected_return_at < now();

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SET search_path = public;


-- =============================================================================
-- STEP 5: Create triggers
-- =============================================================================

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_equipment_updated_at
  BEFORE UPDATE ON equipment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_borrow_requests_updated_at
  BEFORE UPDATE ON borrow_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER on_borrowing_insert
  AFTER INSERT ON borrowing_records
  FOR EACH ROW EXECUTE FUNCTION sync_equipment_on_borrow();

CREATE TRIGGER on_borrowing_status_change
  BEFORE UPDATE ON borrowing_records
  FOR EACH ROW EXECUTE FUNCTION sync_equipment_on_borrow();


-- =============================================================================
-- STEP 6: Create views
-- =============================================================================

CREATE VIEW active_borrowings
WITH (security_invoker = true) AS
SELECT
  br.id,
  br.issuance_type,
  br.borrower_name,
  br.borrower_department,
  br.borrower_employee_id,
  br.borrower_contact,
  br.purpose,
  br.status,
  br.borrowed_at,
  br.expected_return_at,
  br.equipment_id,
  e.name          AS equipment_name,
  e.serial_number,
  e.asset_tag,
  e.condition     AS equipment_condition,
  c.name          AS category_name,
  p.full_name     AS issued_by_name
FROM borrowing_records br
JOIN equipment e  ON e.id = br.equipment_id
JOIN categories c ON c.id = e.category_id
JOIN profiles p   ON p.id = br.issued_by
WHERE br.status IN ('active', 'overdue');

CREATE VIEW equipment_summary
WITH (security_invoker = true) AS
SELECT
  c.name AS category,
  e.status,
  COUNT(*) AS count
FROM equipment e
JOIN categories c ON c.id = e.category_id
GROUP BY c.name, e.status
ORDER BY c.name, e.status;

CREATE VIEW borrow_requests_detail
WITH (security_invoker = true) AS
SELECT
  br.id,
  br.requester_id,
  br.requester_name,
  br.requester_department,
  br.category_id,
  br.equipment_id,
  br.purpose,
  br.needed_from,
  br.needed_until,
  br.status,
  br.reviewer_id,
  br.reviewed_at,
  br.review_notes,
  br.borrowing_record_id,
  br.created_at,
  br.updated_at,
  c.name AS category_name,
  e.name AS equipment_name,
  e.asset_tag AS equipment_asset_tag,
  e.status AS equipment_status,
  reviewer.full_name AS reviewer_name
FROM borrow_requests br
LEFT JOIN categories c ON c.id = br.category_id
LEFT JOIN equipment e ON e.id = br.equipment_id
LEFT JOIN profiles reviewer ON reviewer.id = br.reviewer_id;


-- =============================================================================
-- STEP 7: Enable Row Level Security (RLS)
-- =============================================================================

ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories        ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment         ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrowing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrow_requests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings      ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- STEP 8: Create RLS policies
-- =============================================================================

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
  );

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- -----------------------------------------------------------------------------
-- categories
-- -----------------------------------------------------------------------------
CREATE POLICY "Authenticated users can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Admins can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Admins can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (get_user_role() = 'admin');

-- -----------------------------------------------------------------------------
-- equipment
-- -----------------------------------------------------------------------------
CREATE POLICY "Authenticated users can view equipment"
  ON equipment FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert equipment"
  ON equipment FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Admins can update equipment"
  ON equipment FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- -----------------------------------------------------------------------------
-- borrowing_records
-- -----------------------------------------------------------------------------
CREATE POLICY "Officers and admins can view borrowing records"
  ON borrowing_records FOR SELECT
  TO authenticated
  USING (get_user_role() IN ('admin', 'officer'));

CREATE POLICY "Officers and admins can create borrowing records"
  ON borrowing_records FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'officer'));

CREATE POLICY "Officers and admins can update borrowing records"
  ON borrowing_records FOR UPDATE
  TO authenticated
  USING (get_user_role() IN ('admin', 'officer'))
  WITH CHECK (get_user_role() IN ('admin', 'officer'));

-- -----------------------------------------------------------------------------
-- audit_logs
-- -----------------------------------------------------------------------------
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "Officers and admins can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_role() IN ('admin', 'officer')
    AND user_id = auth.uid()
  );

-- -----------------------------------------------------------------------------
-- borrow_requests
-- -----------------------------------------------------------------------------
CREATE POLICY "View borrow requests"
  ON borrow_requests FOR SELECT
  TO authenticated
  USING (
    requester_id = auth.uid()
    OR get_user_role() IN ('admin', 'officer')
  );

CREATE POLICY "Create borrow requests"
  ON borrow_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    requester_id = auth.uid()
    AND get_user_role() IN ('admin', 'officer', 'staff')
  );

CREATE POLICY "Cancel own pending requests"
  ON borrow_requests FOR UPDATE
  TO authenticated
  USING (requester_id = auth.uid() AND status = 'pending')
  WITH CHECK (requester_id = auth.uid() AND status = 'cancelled');

CREATE POLICY "Officers manage borrow requests"
  ON borrow_requests FOR UPDATE
  TO authenticated
  USING (get_user_role() IN ('admin', 'officer'))
  WITH CHECK (get_user_role() IN ('admin', 'officer'));

-- -----------------------------------------------------------------------------
-- app_settings
-- -----------------------------------------------------------------------------
CREATE POLICY "Authenticated users can view app settings"
  ON app_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can update app settings"
  ON app_settings FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');


-- =============================================================================
-- STEP 9: Grant permissions to Supabase roles
-- =============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE ON profiles          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON categories TO authenticated;
GRANT SELECT, INSERT, UPDATE ON equipment         TO authenticated;
GRANT SELECT, INSERT, UPDATE ON borrowing_records TO authenticated;
GRANT SELECT, INSERT ON audit_logs                TO authenticated;
GRANT SELECT, INSERT, UPDATE ON borrow_requests   TO authenticated;
GRANT SELECT, UPDATE ON app_settings              TO authenticated;

GRANT SELECT ON active_borrowings TO authenticated;
GRANT SELECT ON equipment_summary TO authenticated;
GRANT SELECT ON borrow_requests_detail TO authenticated;

GRANT USAGE ON TYPE user_role           TO authenticated;
GRANT USAGE ON TYPE equipment_status    TO authenticated;
GRANT USAGE ON TYPE equipment_condition TO authenticated;
GRANT USAGE ON TYPE borrowing_status   TO authenticated;
GRANT USAGE ON TYPE issuance_type      TO authenticated;
GRANT USAGE ON TYPE borrow_request_status TO authenticated;

GRANT EXECUTE ON FUNCTION get_user_role()            TO authenticated;
GRANT EXECUTE ON FUNCTION mark_overdue_borrowings() TO authenticated;


-- =============================================================================
-- STEP 10: Seed default equipment categories
-- =============================================================================

INSERT INTO categories (name, description) VALUES
  ('Laptop',            'Laptops and notebook computers'),
  ('Projector',         'Projectors and presentation equipment'),
  ('Keyboard',          'Keyboards'),
  ('Mouse',             'Mice and pointing devices'),
  ('Network Device',    'Routers, switches, and network accessories'),
  ('Power Adapter',     'Chargers and power adapters'),
  ('Extension Cable',   'Extension cords and power cables'),
  ('Testing Equipment', 'Diagnostic and testing tools'),
  ('Other',             'Other ICT equipment');

INSERT INTO app_settings (singleton) VALUES (true);


-- =============================================================================
-- STEP 11: Create your first admin user (run AFTER creating user in Auth)
-- =============================================================================
--
-- A) In Supabase Dashboard:
--      Authentication → Users → Add user → Create new user
--      Enter email + password for your ICT Administrator
--
-- B) Then run this query (replace the email):
--
--   UPDATE public.profiles
--   SET role = 'admin', full_name = 'ICT Administrator'
--   WHERE email = 'admin@yourorganization.com';
--
--   UPDATE auth.users
--   SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
--     || jsonb_build_object('provisioned_by_admin', true)
--   WHERE email = 'admin@yourorganization.com';
--
-- C) Verify:
--
--   SELECT id, full_name, email, role, is_active
--   FROM public.profiles
--   WHERE email = 'admin@yourorganization.com';


-- =============================================================================
-- STEP 12: Verify setup (optional — run to confirm everything was created)
-- =============================================================================

-- List all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- List seeded categories
SELECT id, name FROM categories ORDER BY name;

-- List views
SELECT table_name AS view_name
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- List RLS-enabled tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
