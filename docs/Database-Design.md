# Database Design

## Document Information

| Field | Detail |
|-------|--------|
| **Project Name** | AssetFlow |
| **Version** | 1.0 |
| **Status** | Draft |
| **Last Updated** | June 2026 |

---

## 1. Introduction

AssetFlow uses **PostgreSQL** hosted on **Supabase** as its database. Schema changes are managed through Supabase SQL migrations in the `supabase/migrations/` directory.

This document defines the entity-relationship model, table structures, enums, indexes, and Row Level Security (RLS) policies.

---

## 2. Entity Relationship Diagram

```text
┌─────────────────┐       ┌──────────────────────┐
│   auth.users    │       │     categories       │
│  (Supabase)     │       ├──────────────────────┤
├─────────────────┤       │ id (PK)              │
│ id (PK)         │       │ name                 │
│ email           │       │ description          │
└────────┬────────┘       └──────────┬───────────┘
         │                           │
         │ 1:1                       │ 1:N
         ▼                           ▼
┌─────────────────┐       ┌──────────────────────┐
│    profiles     │       │      equipment       │
├─────────────────┤       ├──────────────────────┤
│ id (PK, FK)     │       │ id (PK)              │
│ full_name       │       │ name                 │
│ email           │       │ category_id (FK)       │
│ role            │       │ serial_number (UQ)     │
│ department      │       │ asset_tag (UQ)       │
│ is_active       │       │ condition            │
│ created_at      │       │ status               │
│ updated_at      │       │ notes                │
└────────┬────────┘       │ created_by (FK)      │
         │                │ created_at           │
         │                │ updated_at           │
         │                └──────────┬───────────┘
         │                           │
         │                           │ 1:N
         │                           ▼
         │                ┌──────────────────────┐
         │                │  borrowing_records   │
         │                ├──────────────────────┤
         │                │ id (PK)              │
         │                │ equipment_id (FK)    │
         │                │ borrower_name        │
         │                │ borrower_department  │
         │                │ borrower_employee_id │
         │                │ borrower_contact     │
         │                │ purpose              │
         │                │ status               │
         │                │ borrowed_at          │
         │                │ expected_return_at   │
         │                │ returned_at          │
         │                │ return_condition     │
         │                │ issued_by (FK)       │
         │                │ returned_by (FK)     │
         │                │ created_at           │
         │                └──────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│   audit_logs    │
├─────────────────┤
│ id (PK)         │
│ user_id (FK)    │
│ action          │
│ entity_type     │
│ entity_id       │
│ details (JSONB) │
│ created_at      │
└─────────────────┘
```

---

## 3. Enums

### 3.1 `user_role`

```sql
CREATE TYPE user_role AS ENUM ('admin', 'officer', 'staff');
```

### 3.2 `equipment_status`

```sql
CREATE TYPE equipment_status AS ENUM (
  'available',
  'borrowed',
  'under_maintenance',
  'retired'
);
```

### 3.3 `equipment_condition`

```sql
CREATE TYPE equipment_condition AS ENUM (
  'excellent',
  'good',
  'fair',
  'poor'
);
```

### 3.4 `borrowing_status`

```sql
CREATE TYPE borrowing_status AS ENUM ('active', 'returned', 'overdue');
```

---

## 4. Table Definitions

### 4.1 `profiles`

Extends Supabase Auth users with application-specific data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, FK → `auth.users.id` | User ID |
| `full_name` | `text` | NOT NULL | Display name |
| `email` | `text` | NOT NULL, UNIQUE | Email address |
| `role` | `user_role` | NOT NULL, DEFAULT `'officer'` | User role |
| `department` | `text` | | ICT Department subdivision |
| `is_active` | `boolean` | NOT NULL, DEFAULT `true` | Account active flag |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Creation timestamp |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Last update timestamp |

```sql
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
```

### 4.2 `categories`

Equipment classification.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` | Category ID |
| `name` | `text` | NOT NULL, UNIQUE | Category name |
| `description` | `text` | | Optional description |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Creation timestamp |

**Seed Data:**

| Name |
|------|
| Laptop |
| Projector |
| Keyboard |
| Mouse |
| Network Device |
| Power Adapter |
| Extension Cable |
| Testing Equipment |
| Other |

```sql
CREATE TABLE categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

### 4.3 `equipment`

ICT asset inventory.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` | Equipment ID |
| `name` | `text` | NOT NULL | Equipment name/model |
| `category_id` | `uuid` | FK → `categories.id`, NOT NULL | Equipment category |
| `serial_number` | `text` | UNIQUE | Manufacturer serial number |
| `asset_tag` | `text` | UNIQUE | Internal asset tag |
| `condition` | `equipment_condition` | NOT NULL, DEFAULT `'good'` | Physical condition |
| `status` | `equipment_status` | NOT NULL, DEFAULT `'available'` | Current status |
| `notes` | `text` | | Additional notes |
| `created_by` | `uuid` | FK → `profiles.id` | User who registered |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Creation timestamp |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Last update timestamp |

```sql
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
```

### 4.4 `borrowing_records`

Tracks equipment issuance and returns.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` | Record ID |
| `equipment_id` | `uuid` | FK → `equipment.id`, NOT NULL | Borrowed equipment |
| `borrower_name` | `text` | NOT NULL | Borrower's full name |
| `borrower_department` | `text` | NOT NULL | Borrower's department |
| `borrower_employee_id` | `text` | | Employee ID |
| `borrower_contact` | `text` | | Phone or email |
| `purpose` | `text` | NOT NULL | Reason for borrowing |
| `status` | `borrowing_status` | NOT NULL, DEFAULT `'active'` | Borrowing status |
| `borrowed_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Issuance timestamp |
| `expected_return_at` | `timestamptz` | | Expected return date |
| `returned_at` | `timestamptz` | | Actual return timestamp |
| `return_condition` | `equipment_condition` | | Condition on return |
| `issued_by` | `uuid` | FK → `profiles.id`, NOT NULL | Officer who issued |
| `returned_by` | `uuid` | FK → `profiles.id` | Officer who processed return |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Creation timestamp |

```sql
CREATE TABLE borrowing_records (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id         uuid NOT NULL REFERENCES equipment(id),
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
  issued_by            uuid NOT NULL REFERENCES profiles(id),
  returned_by          uuid REFERENCES profiles(id),
  created_at           timestamptz NOT NULL DEFAULT now()
);
```

### 4.5 `audit_logs`

Immutable log of system actions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` | Log entry ID |
| `user_id` | `uuid` | FK → `profiles.id` | Acting user |
| `action` | `text` | NOT NULL | Action identifier |
| `entity_type` | `text` | | Affected table/entity |
| `entity_id` | `uuid` | | Affected record ID |
| `details` | `jsonb` | | Additional context |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Action timestamp |

```sql
CREATE TABLE audit_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES profiles(id),
  action      text NOT NULL,
  entity_type text,
  entity_id   uuid,
  details     jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

---

## 5. Indexes

```sql
-- Equipment lookups
CREATE INDEX idx_equipment_status ON equipment(status);
CREATE INDEX idx_equipment_category ON equipment(category_id);
CREATE INDEX idx_equipment_serial ON equipment(serial_number);
CREATE INDEX idx_equipment_asset_tag ON equipment(asset_tag);

-- Borrowing lookups
CREATE INDEX idx_borrowing_status ON borrowing_records(status);
CREATE INDEX idx_borrowing_equipment ON borrowing_records(equipment_id);
CREATE INDEX idx_borrowing_department ON borrowing_records(borrower_department);
CREATE INDEX idx_borrowing_borrowed_at ON borrowing_records(borrowed_at);
CREATE INDEX idx_borrowing_active ON borrowing_records(equipment_id)
  WHERE status = 'active';

-- Audit log lookups
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at);

-- Profile lookups
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_active ON profiles(is_active);
```

---

## 6. Database Functions & Triggers

### 6.1 Auto-Update `updated_at`

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_equipment_updated_at
  BEFORE UPDATE ON equipment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 6.2 Auto-Create Profile on Signup

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'officer')::user_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 6.3 Borrow/Return Status Sync

```sql
CREATE OR REPLACE FUNCTION sync_equipment_on_borrow()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' THEN
    UPDATE equipment SET status = 'borrowed' WHERE id = NEW.equipment_id;
  ELSIF NEW.status = 'returned' AND OLD.status = 'active' THEN
    UPDATE equipment SET status = 'available' WHERE id = NEW.equipment_id;
    NEW.returned_at = COALESCE(NEW.returned_at, now());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_borrowing_status_change
  BEFORE UPDATE ON borrowing_records
  FOR EACH ROW EXECUTE FUNCTION sync_equipment_on_borrow();
```

### 6.4 Mark Overdue Borrowings

```sql
CREATE OR REPLACE FUNCTION mark_overdue_borrowings()
RETURNS void AS $$
BEGIN
  UPDATE borrowing_records
  SET status = 'overdue'
  WHERE status = 'active'
    AND expected_return_at IS NOT NULL
    AND expected_return_at < now();
END;
$$ LANGUAGE plpgsql;
```

---

## 7. Row Level Security (RLS)

RLS is enabled on all application tables. Policies use a helper function to read the user's role from their JWT.

### 7.1 Helper Function

```sql
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

### 7.2 Policy Summary

| Table | Role | SELECT | INSERT | UPDATE | DELETE |
|-------|------|:------:|:------:|:------:|:------:|
| `profiles` | admin | ✓ | ✓ | ✓ | ✗ |
| `profiles` | officer | own only | ✗ | own only | ✗ |
| `categories` | admin | ✓ | ✓ | ✓ | ✓ |
| `categories` | officer | ✓ | ✗ | ✗ | ✗ |
| `equipment` | admin | ✓ | ✓ | ✓ | ✗ |
| `equipment` | officer | ✓ | ✗ | ✗ | ✗ |
| `borrowing_records` | admin | ✓ | ✓ | ✓ | ✗ |
| `borrowing_records` | officer | ✓ | ✓ | ✓ | ✗ |
| `audit_logs` | admin | ✓ | ✗ | ✗ | ✗ |
| `audit_logs` | officer | ✗ | ✗ | ✗ | ✗ |

### 7.3 Example Policies

```sql
-- Enable RLS
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrowing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Equipment: all authenticated users can read
CREATE POLICY "Authenticated users can view equipment"
  ON equipment FOR SELECT
  TO authenticated
  USING (true);

-- Equipment: only admins can insert/update
CREATE POLICY "Admins can manage equipment"
  ON equipment FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- Borrowing: officers and admins can create and update
CREATE POLICY "Officers can manage borrowing"
  ON borrowing_records FOR ALL
  TO authenticated
  USING (get_user_role() IN ('admin', 'officer'))
  WITH CHECK (get_user_role() IN ('admin', 'officer'));

-- Audit logs: read-only for admins
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (get_user_role() = 'admin');
```

---

## 8. Views

### 8.1 `active_borrowings`

Convenience view joining borrowing records with equipment and category details.

```sql
CREATE VIEW active_borrowings AS
SELECT
  br.id,
  br.borrower_name,
  br.borrower_department,
  br.purpose,
  br.borrowed_at,
  br.expected_return_at,
  e.name AS equipment_name,
  e.serial_number,
  e.asset_tag,
  c.name AS category_name,
  p.full_name AS issued_by_name
FROM borrowing_records br
JOIN equipment e ON e.id = br.equipment_id
JOIN categories c ON c.id = e.category_id
JOIN profiles p ON p.id = br.issued_by
WHERE br.status IN ('active', 'overdue');
```

### 8.2 `equipment_summary`

```sql
CREATE VIEW equipment_summary AS
SELECT
  c.name AS category,
  e.status,
  COUNT(*) AS count
FROM equipment e
JOIN categories c ON c.id = e.category_id
GROUP BY c.name, e.status;
```

---

## 9. Migration Strategy

Migrations are stored in `supabase/migrations/` and applied in order:

```text
supabase/migrations/
├── 00001_create_enums.sql
├── 00002_create_profiles.sql
├── 00003_create_categories.sql
├── 00004_create_equipment.sql
├── 00005_create_borrowing_records.sql
├── 00006_create_audit_logs.sql
├── 00007_create_indexes.sql
├── 00008_create_functions_triggers.sql
├── 00009_create_rls_policies.sql
├── 00010_create_views.sql
└── 00011_seed_categories.sql
```

Apply migrations locally:

```bash
supabase db reset
```

Apply to production:

```bash
supabase db push
```

---

## 10. Related Documentation

| Document | Description |
|----------|-------------|
| [API-Documentation.md](./API-Documentation.md) | API endpoints referencing these tables |
| [System-Workflow.md](./System-Workflow.md) | Business flows that modify these tables |
| [Requirements.md](./Requirements.md) | Data requirements |
