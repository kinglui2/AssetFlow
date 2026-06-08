# Requirements Specification

## Document Information

| Field | Detail |
|-------|--------|
| **Project Name** | AssetFlow |
| **Version** | 1.0 |
| **Status** | Draft |
| **Last Updated** | June 2026 |

---

## 1. Introduction

This document defines the functional and non-functional requirements for AssetFlow — the ICT Equipment Borrowing and Asset Tracking System. Requirements are organized by module and prioritized for the initial release.

### 1.1 Requirement Priority Legend

| Priority | Meaning |
|----------|---------|
| **Must Have** | Required for initial release |
| **Should Have** | Important but can follow initial release |
| **Could Have** | Desirable future enhancement |
| **Won't Have** | Out of scope for current release |

---

## 2. Functional Requirements

### 2.1 Authentication & Authorization

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-AUTH-01 | The system shall require users to authenticate before accessing any protected functionality. | Must Have |
| FR-AUTH-02 | The system shall use Supabase Auth for user registration and login. | Must Have |
| FR-AUTH-03 | The system shall issue JWT tokens upon successful authentication. | Must Have |
| FR-AUTH-04 | The system shall enforce role-based access control with at least two roles: ICT Administrator and ICT Officer. | Must Have |
| FR-AUTH-05 | The system shall allow ICT Administrators to create, update, and deactivate user accounts. | Must Have |
| FR-AUTH-06 | The system shall allow users to log out and invalidate their session. | Must Have |
| FR-AUTH-07 | The system shall prevent unauthorized users from accessing admin-only features. | Must Have |

### 2.2 Equipment Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-EQ-01 | The system shall allow authorized users to register new ICT equipment. | Must Have |
| FR-EQ-02 | The system shall capture equipment details: name, category, serial number, asset tag, condition, and status. | Must Have |
| FR-EQ-03 | The system shall support equipment categories (e.g., Laptop, Projector, Keyboard, Mouse, Network Device, Adapter, Cable, Testing Equipment, Other). | Must Have |
| FR-EQ-04 | The system shall track equipment status: Available, Borrowed, Under Maintenance, Retired. | Must Have |
| FR-EQ-05 | The system shall allow authorized users to update equipment information. | Must Have |
| FR-EQ-06 | The system shall allow authorized users to search and filter equipment by name, category, status, or serial number. | Must Have |
| FR-EQ-07 | The system shall prevent issuance of equipment that is not in Available status. | Must Have |
| FR-EQ-08 | The system shall display a list of all registered equipment with current status. | Must Have |
| FR-EQ-09 | The system shall allow ICT Administrators to retire or remove equipment from active inventory. | Should Have |

### 2.3 Borrowing Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-BR-01 | The system shall allow ICT Officers to record equipment issuance to a borrower. | Must Have |
| FR-BR-02 | The system shall capture borrower details: full name, department, employee ID (optional), and contact information. | Must Have |
| FR-BR-03 | The system shall record the purpose of borrowing. | Must Have |
| FR-BR-04 | The system shall automatically record the borrowing date and time upon issuance. | Must Have |
| FR-BR-05 | The system shall automatically update equipment status to Borrowed upon issuance. | Must Have |
| FR-BR-06 | The system shall maintain a complete history of all borrowing transactions. | Must Have |
| FR-BR-07 | The system shall allow viewing of currently borrowed items and their borrowers. | Must Have |
| FR-BR-08 | The system shall allow recording an expected return date. | Should Have |
| FR-BR-09 | The system shall flag overdue borrowings when expected return date has passed. | Should Have |

### 2.4 Return Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-RT-01 | The system shall allow ICT Officers to record equipment returns. | Must Have |
| FR-RT-02 | The system shall automatically record the return date and time. | Must Have |
| FR-RT-03 | The system shall automatically update equipment status to Available upon return. | Must Have |
| FR-RT-04 | The system shall allow recording the condition of equipment upon return. | Should Have |
| FR-RT-05 | The system shall link each return to its corresponding borrowing record. | Must Have |
| FR-RT-06 | The system shall prevent returning equipment that is not currently borrowed. | Must Have |

### 2.5 Reporting

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-RP-01 | The system shall provide a borrowing history report. | Must Have |
| FR-RP-02 | The system shall allow filtering reports by department. | Must Have |
| FR-RP-03 | The system shall allow filtering reports by equipment type/category. | Must Have |
| FR-RP-04 | The system shall allow filtering reports by borrower name. | Must Have |
| FR-RP-05 | The system shall allow filtering reports by date range. | Must Have |
| FR-RP-06 | The system shall allow exporting reports as CSV or PDF. | Should Have |
| FR-RP-07 | The system shall provide a summary of currently borrowed equipment. | Must Have |
| FR-RP-08 | The system shall provide an equipment inventory report. | Should Have |

### 2.6 Audit Trail

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-AU-01 | The system shall log all significant user actions (login, equipment changes, borrow/return transactions). | Must Have |
| FR-AU-02 | Each audit log entry shall include: user, action, timestamp, and affected record. | Must Have |
| FR-AU-03 | The system shall allow ICT Administrators to view audit logs. | Must Have |
| FR-AU-04 | The system shall allow filtering audit logs by user, action type, and date range. | Should Have |
| FR-AU-05 | Audit logs shall not be editable or deletable by any user. | Must Have |

### 2.7 User Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-UM-01 | The system shall allow ICT Administrators to create new user accounts with assigned roles. | Must Have |
| FR-UM-02 | The system shall allow ICT Administrators to update user roles. | Must Have |
| FR-UM-03 | The system shall allow ICT Administrators to deactivate user accounts. | Must Have |
| FR-UM-04 | The system shall store user profile information: name, email, role, and department. | Must Have |

### 2.8 Future Enhancements (Out of Scope — Initial Release)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-FU-01 | Staff members shall be able to submit borrowing requests online. | Could Have |
| FR-FU-02 | Staff members shall be able to view their borrowing history. | Could Have |
| FR-FU-03 | The system shall send email notifications for overdue returns. | Could Have |
| FR-FU-04 | The system shall support QR code scanning for equipment identification. | Could Have |

---

## 3. Non-Functional Requirements

### 3.1 Performance

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-PF-01 | Page load time shall not exceed 3 seconds on a standard office network connection. | Must Have |
| NFR-PF-02 | Search and filter operations shall return results within 2 seconds. | Must Have |
| NFR-PF-03 | The system shall support at least 50 concurrent users without degradation. | Should Have |

### 3.2 Security

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-SC-01 | All communication between client and server shall use HTTPS. | Must Have |
| NFR-SC-02 | Passwords shall be hashed and never stored in plain text (handled by Supabase Auth). | Must Have |
| NFR-SC-03 | Row Level Security (RLS) policies shall enforce data access at the database level. | Must Have |
| NFR-SC-04 | JWT tokens shall expire after a configurable session duration. | Must Have |
| NFR-SC-05 | The system shall not expose database credentials in the frontend. | Must Have |
| NFR-SC-06 | API keys shall be stored in environment variables, not in source code. | Must Have |

### 3.3 Availability & Reliability

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-AV-01 | The system shall be hosted on cloud infrastructure (Supabase) with high availability. | Must Have |
| NFR-AV-02 | Database backups shall be managed by Supabase hosting. | Must Have |
| NFR-AV-03 | The system shall gracefully handle network errors and display user-friendly messages. | Must Have |

### 3.4 Usability

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-US-01 | The interface shall be responsive and usable on desktop browsers (minimum 1024px width). | Must Have |
| NFR-US-02 | The system shall provide clear feedback for successful and failed operations. | Must Have |
| NFR-US-03 | Forms shall include validation with descriptive error messages. | Must Have |
| NFR-US-04 | The interface shall follow a consistent design language using Tailwind CSS. | Must Have |

### 3.5 Maintainability

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-MT-01 | Database schema changes shall be managed through Supabase SQL migrations. | Must Have |
| NFR-MT-02 | Source code shall be version-controlled using Git and GitHub. | Must Have |
| NFR-MT-03 | Environment-specific configuration shall be separated from application code. | Must Have |

### 3.6 Compatibility

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-CP-01 | The system shall support modern browsers: Chrome, Firefox, Edge, and Safari (latest two versions). | Must Have |
| NFR-CP-02 | The frontend shall be deployable to standard static hosting platforms. | Must Have |

---

## 4. System Constraints

| Constraint | Description |
|------------|-------------|
| **Hosting** | Backend and database must be hosted on Supabase; no local database server. |
| **Internal Use** | System is for internal organizational use only. |
| **Budget** | Must utilize free or low-cost tiers where possible (Supabase free tier, static hosting). |
| **Browser-Based** | No native mobile app in initial release; web browser access only. |

---

## 5. Assumptions

- ICT staff have access to desktop computers with modern web browsers.
- The organization has internet connectivity for cloud-hosted services.
- ICT Administrators are responsible for initial user account setup.
- Borrower information is provided verbally or via staff ID at the ICT desk (no self-service portal in initial release).
- Equipment categories are predefined by the ICT Department.

---

## 6. Dependencies

| Dependency | Description |
|------------|-------------|
| Supabase | Cloud platform for database, auth, and API |
| Supabase Client SDK | Frontend library for API and auth integration |
| React / Vite | Frontend framework and build tool |
| Static hosting provider | Frontend deployment (Vercel, Netlify, etc.) |

---

## 7. Acceptance Criteria (Initial Release)

The initial release is considered complete when:

1. ICT Administrators can manage users, equipment inventory, and view audit logs.
2. ICT Officers can issue equipment, record returns, and search records.
3. Equipment status updates automatically on borrow and return.
4. Reports can be generated with department, equipment type, borrower, and date filters.
5. All data is persisted in Supabase PostgreSQL with RLS policies enforced.
6. The application is deployed and accessible via a web URL.

---

## 8. Related Documentation

| Document | Description |
|----------|-------------|
| [Project-Overview.md](./Project-Overview.md) | High-level project summary |
| [User-Roles.md](./User-Roles.md) | Role definitions and permissions |
| [System-Workflow.md](./System-Workflow.md) | Business process flows |
| [Database-Design.md](./Database-Design.md) | Database schema design |
| [API-Documentation.md](./API-Documentation.md) | API reference |
