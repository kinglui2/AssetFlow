-- =============================================================================
-- AssetFlow — Borrow requests + application settings
-- =============================================================================
-- Run in Supabase SQL Editor on an existing project.
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE borrow_request_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS borrow_requests (
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

CREATE INDEX IF NOT EXISTS idx_borrow_requests_status ON borrow_requests(status);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_requester ON borrow_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_created_at ON borrow_requests(created_at);

CREATE TABLE IF NOT EXISTS app_settings (
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

INSERT INTO app_settings (singleton)
SELECT true
WHERE NOT EXISTS (SELECT 1 FROM app_settings WHERE singleton = true);

DROP TRIGGER IF EXISTS set_borrow_requests_updated_at ON borrow_requests;
CREATE TRIGGER set_borrow_requests_updated_at
  BEFORE UPDATE ON borrow_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_app_settings_updated_at ON app_settings;
CREATE TRIGGER set_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP VIEW IF EXISTS borrow_requests_detail;

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

ALTER TABLE borrow_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View borrow requests" ON borrow_requests;
CREATE POLICY "View borrow requests"
  ON borrow_requests FOR SELECT
  TO authenticated
  USING (
    requester_id = auth.uid()
    OR get_user_role() IN ('admin', 'officer')
  );

DROP POLICY IF EXISTS "Create borrow requests" ON borrow_requests;
CREATE POLICY "Create borrow requests"
  ON borrow_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    requester_id = auth.uid()
    AND get_user_role() IN ('admin', 'officer', 'staff')
  );

DROP POLICY IF EXISTS "Cancel own pending requests" ON borrow_requests;
CREATE POLICY "Cancel own pending requests"
  ON borrow_requests FOR UPDATE
  TO authenticated
  USING (requester_id = auth.uid() AND status = 'pending')
  WITH CHECK (requester_id = auth.uid() AND status = 'cancelled');

DROP POLICY IF EXISTS "Officers manage borrow requests" ON borrow_requests;
CREATE POLICY "Officers manage borrow requests"
  ON borrow_requests FOR UPDATE
  TO authenticated
  USING (get_user_role() IN ('admin', 'officer'))
  WITH CHECK (get_user_role() IN ('admin', 'officer'));

DROP POLICY IF EXISTS "Authenticated users can view app settings" ON app_settings;
CREATE POLICY "Authenticated users can view app settings"
  ON app_settings FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can update app settings" ON app_settings;
CREATE POLICY "Admins can update app settings"
  ON app_settings FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

GRANT SELECT, INSERT, UPDATE ON borrow_requests TO authenticated;
GRANT SELECT, UPDATE ON app_settings TO authenticated;
GRANT SELECT ON borrow_requests_detail TO authenticated;
GRANT USAGE ON TYPE borrow_request_status TO authenticated;
