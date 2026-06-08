# API Documentation

## Document Information

| Field | Detail |
|-------|--------|
| **Project Name** | AssetFlow |
| **Version** | 1.0 |
| **Status** | Draft |
| **Last Updated** | June 2026 |

---

## 1. Introduction

AssetFlow uses **Supabase** as its backend, which provides:

- **Auto-generated REST API** (PostgREST) for direct table access
- **Supabase Auth** for authentication
- **Edge Functions** for custom server-side logic (when needed)

The frontend communicates with Supabase using the **Supabase JavaScript Client** (`@supabase/supabase-js`).

---

## 2. Base Configuration

### 2.1 Environment Variables

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

> **Security Note:** Only the `anon` (public) key is used in the frontend. The `service_role` key must never be exposed in client-side code.

### 2.2 Client Initialization

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### 2.3 Base URLs

| Service | URL |
|---------|-----|
| REST API | `https://<project-ref>.supabase.co/rest/v1/` |
| Auth | `https://<project-ref>.supabase.co/auth/v1/` |
| Edge Functions | `https://<project-ref>.supabase.co/functions/v1/` |
| Realtime | `wss://<project-ref>.supabase.co/realtime/v1/` |

---

## 3. Authentication API

### 3.1 Sign In

```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'officer@organization.com',
  password: 'secure-password',
});
```

**Response (success):**

```json
{
  "user": {
    "id": "uuid",
    "email": "officer@organization.com"
  },
  "session": {
    "access_token": "jwt-token",
    "refresh_token": "refresh-token",
    "expires_at": 1717880000
  }
}
```

### 3.2 Sign Out

```javascript
const { error } = await supabase.auth.signOut();
```

### 3.3 Get Current Session

```javascript
const { data: { session } } = await supabase.auth.getSession();
```

### 3.4 Get Current User Profile

```javascript
const { data: { user } } = await supabase.auth.getUser();

const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();
```

### 3.5 Create User (Admin Only)

User creation is performed by an administrator. This uses Supabase Auth admin functions, typically via an Edge Function to avoid exposing the service role key.

**Edge Function:** `create-user`

```javascript
const { data, error } = await supabase.functions.invoke('create-user', {
  body: {
    email: 'newofficer@organization.com',
    password: 'temporary-password',
    full_name: 'Jane Officer',
    role: 'officer',
    department: 'ICT',
  },
});
```

---

## 4. Equipment API

Base table: `equipment`

### 4.1 List All Equipment

```javascript
const { data, error } = await supabase
  .from('equipment')
  .select(`
    *,
    categories ( id, name ),
    profiles:created_by ( full_name )
  `)
  .order('name');
```

**Query Parameters (PostgREST):**

| Parameter | Example | Description |
|-----------|---------|-------------|
| `status` | `eq.available` | Filter by status |
| `category_id` | `eq.<uuid>` | Filter by category |
| `name` | `ilike.*laptop*` | Search by name |
| `serial_number` | `eq.SN-12345` | Exact serial match |

**Example — Available laptops:**

```javascript
const { data } = await supabase
  .from('equipment')
  .select('*, categories(name)')
  .eq('status', 'available')
  .eq('categories.name', 'Laptop');
```

### 4.2 Get Single Equipment

```javascript
const { data, error } = await supabase
  .from('equipment')
  .select('*, categories(name)')
  .eq('id', equipmentId)
  .single();
```

### 4.3 Register Equipment (Admin)

```javascript
const { data, error } = await supabase
  .from('equipment')
  .insert({
    name: 'Dell Latitude 5540',
    category_id: 'category-uuid',
    serial_number: 'SN-DL-001',
    asset_tag: 'ICT-LAP-042',
    condition: 'good',
    status: 'available',
    notes: 'Includes charger',
    created_by: userId,
  })
  .select()
  .single();
```

### 4.4 Update Equipment (Admin)

```javascript
const { data, error } = await supabase
  .from('equipment')
  .update({
    condition: 'fair',
    status: 'under_maintenance',
    notes: 'Screen flickering — sent for repair',
  })
  .eq('id', equipmentId)
  .select()
  .single();
```

### 4.5 Search Equipment

```javascript
const { data, error } = await supabase
  .from('equipment')
  .select('*, categories(name)')
  .or(`name.ilike.%${searchTerm}%,serial_number.ilike.%${searchTerm}%,asset_tag.ilike.%${searchTerm}%`);
```

---

## 5. Categories API

Base table: `categories`

### 5.1 List Categories

```javascript
const { data, error } = await supabase
  .from('categories')
  .select('*')
  .order('name');
```

### 5.2 Create Category (Admin)

```javascript
const { data, error } = await supabase
  .from('categories')
  .insert({ name: 'Webcam', description: 'USB webcams' })
  .select()
  .single();
```

---

## 6. Borrowing API

Base table: `borrowing_records`

### 6.1 Issue Equipment (Borrow)

```javascript
const { data, error } = await supabase
  .from('borrowing_records')
  .insert({
    equipment_id: 'equipment-uuid',
    borrower_name: 'John Doe',
    borrower_department: 'Finance',
    borrower_employee_id: 'EMP-1234',
    borrower_contact: '0712345678',
    purpose: 'Board presentation',
    expected_return_at: '2026-06-15T17:00:00Z',
    issued_by: userId,
  })
  .select()
  .single();

// Equipment status is updated to 'borrowed' via database trigger
```

### 6.2 Record Return

```javascript
const { data, error } = await supabase
  .from('borrowing_records')
  .update({
    status: 'returned',
    returned_at: new Date().toISOString(),
    return_condition: 'good',
    returned_by: userId,
  })
  .eq('id', borrowingId)
  .select()
  .single();

// Equipment status is updated to 'available' via database trigger
```

### 6.3 List Active Borrowings

```javascript
const { data, error } = await supabase
  .from('active_borrowings')
  .select('*')
  .order('borrowed_at', { ascending: false });
```

### 6.4 Borrowing History with Filters

```javascript
let query = supabase
  .from('borrowing_records')
  .select(`
    *,
    equipment ( name, serial_number, asset_tag, categories ( name ) ),
    issued_by_profile:profiles!issued_by ( full_name ),
    returned_by_profile:profiles!returned_by ( full_name )
  `)
  .order('borrowed_at', { ascending: false });

if (department) query = query.eq('borrower_department', department);
if (status) query = query.eq('status', status);
if (dateFrom) query = query.gte('borrowed_at', dateFrom);
if (dateTo) query = query.lte('borrowed_at', dateTo);

const { data, error } = await query;
```

### 6.5 Get Borrowing by Equipment

```javascript
const { data, error } = await supabase
  .from('borrowing_records')
  .select('*')
  .eq('equipment_id', equipmentId)
  .eq('status', 'active')
  .single();
```

---

## 7. Reports API

Reports are generated by querying existing tables and views with filters.

### 7.1 Currently Borrowed Report

```javascript
const { data, error } = await supabase
  .from('active_borrowings')
  .select('*');
```

### 7.2 Overdue Items

```javascript
const { data, error } = await supabase
  .from('borrowing_records')
  .select(`
    *,
    equipment ( name, serial_number, asset_tag )
  `)
  .eq('status', 'overdue')
  .order('expected_return_at');
```

### 7.3 Equipment Inventory Summary

```javascript
const { data, error } = await supabase
  .from('equipment_summary')
  .select('*');
```

### 7.4 Borrowing History by Date Range

```javascript
const { data, error } = await supabase
  .from('borrowing_records')
  .select(`
    *,
    equipment ( name, categories ( name ) )
  `)
  .gte('borrowed_at', '2026-01-01')
  .lte('borrowed_at', '2026-06-30')
  .order('borrowed_at', { ascending: false });
```

### 7.5 Export to CSV

CSV export is handled client-side by converting query results:

```javascript
function exportToCSV(data, filename) {
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => Object.values(row).join(','));
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}
```

---

## 8. User Management API

Base table: `profiles`

### 8.1 List Users (Admin)

```javascript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .order('full_name');
```

### 8.2 Update User Role (Admin)

```javascript
const { data, error } = await supabase
  .from('profiles')
  .update({ role: 'admin' })
  .eq('id', userId)
  .select()
  .single();
```

### 8.3 Deactivate User (Admin)

```javascript
const { data, error } = await supabase
  .from('profiles')
  .update({ is_active: false })
  .eq('id', userId)
  .select()
  .single();
```

---

## 9. Audit Log API

Base table: `audit_logs` (read-only, admin only)

### 9.1 List Audit Logs

```javascript
const { data, error } = await supabase
  .from('audit_logs')
  .select(`
    *,
    profiles ( full_name, email )
  `)
  .order('created_at', { ascending: false })
  .limit(100);
```

### 9.2 Filter Audit Logs

```javascript
let query = supabase
  .from('audit_logs')
  .select('*, profiles(full_name)')
  .order('created_at', { ascending: false });

if (userId) query = query.eq('user_id', userId);
if (action) query = query.eq('action', action);
if (dateFrom) query = query.gte('created_at', dateFrom);
if (dateTo) query = query.lte('created_at', dateTo);

const { data, error } = await query;
```

### 9.3 Create Audit Log Entry

Audit entries are typically created by database triggers or application-side helpers:

```javascript
async function logAudit(supabase, { userId, action, entityType, entityId, details }) {
  await supabase.from('audit_logs').insert({
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
  });
}

// Usage
await logAudit(supabase, {
  userId: user.id,
  action: 'equipment_issued',
  entityType: 'borrowing_records',
  entityId: borrowingRecord.id,
  details: { equipment: 'Dell Latitude 5540', borrower: 'John Doe' },
});
```

---

## 10. Edge Functions

Edge Functions handle operations that require elevated privileges or custom business logic.

### 10.1 `create-user`

Creates a new user account with profile. Requires admin role.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User email |
| `password` | string | Yes | Initial password |
| `full_name` | string | Yes | Display name |
| `role` | string | Yes | `admin` or `officer` |
| `department` | string | No | Department name |

**Endpoint:** `POST /functions/v1/create-user`

### 10.2 `export-report`

Generates a formatted report (PDF) server-side. Optional for initial release.

**Endpoint:** `POST /functions/v1/export-report`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `report_type` | string | Yes | `borrowing_history`, `inventory`, `overdue` |
| `filters` | object | No | Filter parameters |

### 10.3 `mark-overdue`

Scheduled function to update overdue borrowing statuses. Can be triggered via Supabase cron.

**Endpoint:** `POST /functions/v1/mark-overdue`

---

## 11. Error Handling

### 11.1 Standard Error Response

```json
{
  "code": "42501",
  "message": "permission denied for table equipment",
  "details": null,
  "hint": null
}
```

### 11.2 Common Error Codes

| Code | Meaning | Typical Cause |
|------|---------|---------------|
| `401` | Unauthorized | Missing or expired JWT |
| `403` / `42501` | Forbidden | RLS policy denied access |
| `404` / `PGRST116` | Not found | Record does not exist |
| `409` / `23505` | Conflict | Unique constraint violation |
| `422` / `23502` | Validation | Required field missing |

### 11.3 Frontend Error Handling Pattern

```javascript
const { data, error } = await supabase.from('equipment').insert(payload);

if (error) {
  if (error.code === '42501') {
    showToast('You do not have permission to perform this action.');
  } else if (error.code === '23505') {
    showToast('An equipment item with this serial number or asset tag already exists.');
  } else {
    showToast('An unexpected error occurred. Please try again.');
  }
  return;
}

showToast('Equipment registered successfully.');
```

---

## 12. Realtime Subscriptions (Optional)

Subscribe to equipment status changes for live dashboard updates:

```javascript
const channel = supabase
  .channel('equipment-changes')
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'equipment' },
    (payload) => {
      console.log('Equipment updated:', payload.new);
      refreshEquipmentList();
    }
  )
  .subscribe();
```

---

## 13. API Conventions

| Convention | Detail |
|------------|--------|
| **Authentication** | Bearer JWT in `Authorization` header (handled automatically by Supabase client) |
| **Content-Type** | `application/json` |
| **Timestamps** | ISO 8601 format (`timestamptz`) |
| **IDs** | UUID v4 |
| **Pagination** | `.range(from, to)` — e.g., `.range(0, 49)` for first 50 records |
| **Sorting** | `.order('column', { ascending: false })` |
| **Filtering** | PostgREST operators: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `like`, `ilike`, `in` |

---

## 14. Related Documentation

| Document | Description |
|----------|-------------|
| [Database-Design.md](./Database-Design.md) | Table schemas referenced by these APIs |
| [System-Workflow.md](./System-Workflow.md) | Business flows using these APIs |
| [User-Roles.md](./User-Roles.md) | RLS policies governing API access |
