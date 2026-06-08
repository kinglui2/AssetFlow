# User Roles & Permissions

## Document Information

| Field | Detail |
|-------|--------|
| **Project Name** | AssetFlow |
| **Version** | 1.0 |
| **Status** | Draft |
| **Last Updated** | June 2026 |

---

## 1. Introduction

AssetFlow implements role-based access control (RBAC) to ensure users can only perform actions appropriate to their responsibilities. Roles are enforced at both the application layer and the database layer through Supabase Row Level Security (RLS) policies.

---

## 2. Role Summary

| Role | Code | Description | Initial Release |
|------|------|-------------|-----------------|
| ICT Administrator | `admin` | Full system access; manages users, settings, and audit logs | Yes |
| ICT Officer | `officer` | Day-to-day borrowing operations and reporting | Yes |
| Staff Member | `staff` | Self-service borrowing requests and history | Future |

---

## 3. ICT Administrator

### 3.1 Description

The ICT Administrator is the highest-privilege user. This role is typically assigned to the ICT Department head or a designated system administrator responsible for overall system governance.

### 3.2 Responsibilities

- Manage the equipment inventory (register, update, retire assets)
- Create, update, and deactivate user accounts
- Assign roles to users
- Generate and export reports
- View and filter audit logs
- Configure system settings
- Oversee data integrity and compliance

### 3.3 Permissions

| Module | Permission | Allowed |
|--------|------------|---------|
| **Authentication** | Login / Logout | Yes |
| **Equipment** | View all equipment | Yes |
| **Equipment** | Register new equipment | Yes |
| **Equipment** | Update equipment details | Yes |
| **Equipment** | Change equipment status | Yes |
| **Equipment** | Retire / deactivate equipment | Yes |
| **Borrowing** | Issue equipment | Yes |
| **Borrowing** | View all borrowing records | Yes |
| **Borrowing** | Search borrowing history | Yes |
| **Returns** | Record equipment returns | Yes |
| **Reports** | View all reports | Yes |
| **Reports** | Export reports (CSV/PDF) | Yes |
| **Users** | Create user accounts | Yes |
| **Users** | Update user roles | Yes |
| **Users** | Deactivate user accounts | Yes |
| **Users** | View user list | Yes |
| **Audit** | View audit logs | Yes |
| **Audit** | Filter audit logs | Yes |
| **Settings** | Configure system settings | Yes |

---

## 4. ICT Officer

### 4.1 Description

The ICT Officer handles daily equipment borrowing operations at the ICT desk. This is the primary operational role used for issuing and returning equipment.

### 4.2 Responsibilities

- Issue equipment to staff members
- Record equipment returns
- Search equipment and borrowing records
- View reports related to borrowing activity
- Verify borrower information at the point of issuance

### 4.3 Permissions

| Module | Permission | Allowed |
|--------|------------|---------|
| **Authentication** | Login / Logout | Yes |
| **Equipment** | View all equipment | Yes |
| **Equipment** | Register new equipment | No |
| **Equipment** | Update equipment details | No |
| **Equipment** | Change equipment status (manual) | No |
| **Equipment** | Retire / deactivate equipment | No |
| **Borrowing** | Issue equipment | Yes |
| **Borrowing** | View all borrowing records | Yes |
| **Borrowing** | Search borrowing history | Yes |
| **Returns** | Record equipment returns | Yes |
| **Reports** | View borrowing reports | Yes |
| **Reports** | Export reports (CSV/PDF) | Yes |
| **Users** | Manage user accounts | No |
| **Audit** | View audit logs | No |
| **Settings** | Configure system settings | No |

> **Note:** Equipment status changes to Borrowed and Available are handled automatically when the officer processes borrow and return transactions. Officers do not manually change equipment status.

---

## 5. Staff Member (Future Enhancement)

### 5.1 Description

Staff Members are organizational employees who borrow ICT equipment. In the initial release, staff interact with the system indirectly through ICT Officers. A future self-service portal will allow staff to submit requests and track status online.

### 5.2 Planned Responsibilities

- Submit equipment borrowing requests
- View personal borrowing history
- Track request approval status
- Receive notifications on request updates

### 5.3 Planned Permissions

| Module | Permission | Allowed |
|--------|------------|---------|
| **Authentication** | Login / Logout | Yes |
| **Equipment** | View available equipment (read-only) | Yes |
| **Borrowing** | Submit borrowing request | Yes |
| **Borrowing** | View own borrowing history | Yes |
| **Borrowing** | Cancel pending request | Yes |
| **Returns** | Record returns | No |
| **Reports** | View own reports | Yes |
| **Users** | Manage users | No |
| **Audit** | View audit logs | No |
| **Settings** | Configure settings | No |

---

## 6. Permission Matrix

Quick-reference matrix for the initial release:

| Action | Admin | Officer | Staff (Future) |
|--------|:-----:|:-------:|:--------------:|
| Login | ✓ | ✓ | ✓ |
| View equipment list | ✓ | ✓ | ✓ (available only) |
| Register equipment | ✓ | ✗ | ✗ |
| Update equipment | ✓ | ✗ | ✗ |
| Retire equipment | ✓ | ✗ | ✗ |
| Issue equipment | ✓ | ✓ | ✗ |
| Record return | ✓ | ✓ | ✗ |
| View borrowing history | ✓ | ✓ | Own only |
| Generate reports | ✓ | ✓ | Own only |
| Export reports | ✓ | ✓ | ✗ |
| Manage users | ✓ | ✗ | ✗ |
| View audit logs | ✓ | ✗ | ✗ |
| System settings | ✓ | ✗ | ✗ |
| Submit borrow request | ✗ | ✗ | ✓ |

---

## 7. Role Implementation

### 7.1 Storage

User roles are stored in a `profiles` table linked to Supabase Auth users:

```text
auth.users (Supabase managed)
    │
    └── profiles
            ├── id (FK → auth.users.id)
            ├── full_name
            ├── email
            ├── role (admin | officer | staff)
            ├── department
            └── is_active
```

### 7.2 Enforcement

Roles are enforced through two layers:

1. **Frontend**: UI elements are shown or hidden based on the authenticated user's role.
2. **Database (RLS)**: Supabase Row Level Security policies restrict read/write access to tables based on the user's role extracted from their JWT.

Example RLS policy concept:

```sql
-- Only admins can insert into profiles (user management)
CREATE POLICY "Admins can manage profiles"
ON profiles FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');
```

### 7.3 Role Assignment

- Only ICT Administrators can assign or change roles.
- A user must have exactly one role at any time.
- At least one Administrator account must always exist in the system.
- Deactivated users retain their records but cannot log in.

---

## 8. Default Accounts

During initial system setup, the following default account should be created:

| Account | Role | Purpose |
|---------|------|---------|
| Initial admin | `admin` | Bootstrap system; create officer accounts |

All other accounts are created by the Administrator through the user management interface.

---

## 9. Related Documentation

| Document | Description |
|----------|-------------|
| [Requirements.md](./Requirements.md) | Authorization requirements |
| [System-Workflow.md](./System-Workflow.md) | Process flows by role |
| [Database-Design.md](./Database-Design.md) | Profiles table and RLS policies |
| [User-Manual.md](./User-Manual.md) | Step-by-step guides per role |
