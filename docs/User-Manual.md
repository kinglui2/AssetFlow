# User Manual

## Document Information

| Field | Detail |
|-------|--------|
| **Project Name** | AssetFlow |
| **Version** | 1.0 |
| **Status** | Draft |
| **Last Updated** | June 2026 |
| **Audience** | ICT Administrators and ICT Officers |

---

## 1. Introduction

This manual provides step-by-step instructions for using AssetFlow — the ICT Equipment Borrowing and Asset Tracking System. It covers daily operations for ICT Officers and administrative tasks for ICT Administrators.

### 1.1 System Requirements

- A modern web browser (Chrome, Firefox, Edge, or Safari — latest version)
- Internet connection
- Valid AssetFlow user account

### 1.2 Accessing the System

1. Open your web browser.
2. Navigate to the AssetFlow URL provided by your ICT Administrator.
3. You will see the login page.

---

## 2. Logging In

1. Enter your **email address** in the Email field.
2. Enter your **password** in the Password field.
3. Click **Sign In**.
4. On success, you are taken to the Dashboard.
5. If login fails, verify your credentials and try again. Contact your Administrator if you have forgotten your password.

### 2.1 Logging Out

1. Click your name or the menu icon in the top navigation bar.
2. Click **Sign Out**.
3. You are returned to the login page.

> **Tip:** Always log out when leaving your workstation unattended.

---

## 3. Dashboard

After logging in, the Dashboard provides an at-a-glance overview:

| Widget | Description |
|--------|-------------|
| **Total Equipment** | Number of registered assets |
| **Available** | Equipment ready to borrow |
| **Currently Borrowed** | Active borrowings |
| **Overdue** | Borrowings past expected return date |

Use the sidebar navigation to access specific modules.

---

## 4. Equipment Management

> **Access:** ICT Administrator only (viewing is available to Officers)

### 4.1 Viewing Equipment

1. Click **Equipment** in the sidebar.
2. The equipment list displays all registered assets with name, category, serial number, asset tag, condition, and status.
3. Use the **search bar** to find equipment by name, serial number, or asset tag.
4. Use the **status filter** to show only Available, Borrowed, Under Maintenance, or Retired items.
5. Use the **category filter** to narrow by equipment type.

### 4.2 Registering New Equipment

1. Click **Equipment** in the sidebar.
2. Click the **Add Equipment** button.
3. Fill in the form:

   | Field | Required | Description |
   |-------|----------|-------------|
   | Name | Yes | Equipment name or model (e.g., "Dell Latitude 5540") |
   | Category | Yes | Select from dropdown (Laptop, Projector, etc.) |
   | Serial Number | No | Manufacturer serial number |
   | Asset Tag | No | Internal ICT asset tag |
   | Condition | Yes | Excellent, Good, Fair, or Poor |
   | Notes | No | Additional information |

4. Click **Save**.
5. The equipment appears in the list with status **Available**.

### 4.3 Updating Equipment

1. Find the equipment in the list.
2. Click the **Edit** button (pencil icon) on the row.
3. Update the desired fields.
4. Click **Save**.

### 4.4 Changing Equipment Status (Admin)

To mark equipment as under maintenance or retired:

1. Edit the equipment record.
2. Change the **Status** field to:
   - **Under Maintenance** — temporarily unavailable
   - **Retired** — permanently removed from active inventory
3. Click **Save**.

---

## 5. Issuing Equipment (Borrowing)

> **Access:** ICT Officer and ICT Administrator

This process replaces writing in the physical logbook.

### 5.1 Issue Equipment to a Staff Member

1. A staff member requests equipment at the ICT desk.
2. Click **Borrow** in the sidebar (or **Issue Equipment** from the Equipment page).
3. Search for and select the equipment to issue.
   - Only equipment with status **Available** can be issued.
4. Fill in the borrower details:

   | Field | Required | Description |
   |-------|----------|-------------|
   | Borrower Name | Yes | Full name of the staff member |
   | Department | Yes | Borrower's department |
   | Employee ID | No | Staff ID number |
   | Contact | No | Phone number or email |
   | Purpose | Yes | Reason for borrowing |
   | Expected Return Date | No | When the item should be returned |

5. Click **Issue Equipment**.
6. A confirmation message appears.
7. The equipment status changes to **Borrowed**.
8. Inform the staff member that the equipment has been issued.

### 5.2 Viewing Currently Borrowed Items

1. Click **Borrow** in the sidebar.
2. Select the **Active Borrowings** tab.
3. The list shows all items currently borrowed, including borrower name, department, equipment, and borrow date.

---

## 6. Recording Returns

> **Access:** ICT Officer and ICT Administrator

### 6.1 Process a Return

1. A staff member returns equipment to the ICT desk.
2. Click **Borrow** in the sidebar.
3. Select the **Active Borrowings** tab.
4. Find the borrowing record (search by borrower name, department, or equipment).
5. Click **Record Return** on the corresponding row.
6. Optionally note the **condition** of the returned equipment.
7. Click **Confirm Return**.
8. A confirmation message appears.
9. The equipment status changes back to **Available**.
10. Return the equipment to the staff member or place it back in inventory.

---

## 7. Searching Records

### 7.1 Search Equipment

1. Go to **Equipment**.
2. Type in the search bar to filter by name, serial number, or asset tag.
3. Results update as you type.

### 7.2 Search Borrowing History

1. Go to **Borrow** or **Reports**.
2. Use available filters:
   - Borrower name
   - Department
   - Equipment type
   - Date range
   - Status (Active, Returned, Overdue)

---

## 8. Reports

> **Access:** ICT Officer and ICT Administrator

### 8.1 Generate a Report

1. Click **Reports** in the sidebar.
2. Select the report type:

   | Report | Description |
   |--------|-------------|
   | Borrowing History | All borrowing transactions |
   | Currently Borrowed | Items not yet returned |
   | Equipment Inventory | Full asset list with status |
   | Overdue Items | Past expected return date |

3. Apply filters as needed:
   - **Department** — filter by borrower department
   - **Category** — filter by equipment type
   - **Borrower** — filter by borrower name
   - **Date Range** — filter by borrow date

4. Click **Generate Report**.
5. Results appear in a table below the filters.

### 8.2 Export a Report

1. After generating a report, click **Export CSV**.
2. The file downloads to your computer.
3. Open it in Excel or any spreadsheet application.

---

## 9. User Management

> **Access:** ICT Administrator only

### 9.1 View Users

1. Click **Users** in the sidebar.
2. The list shows all registered users with name, email, role, and status.

### 9.2 Create a New User

1. Click **Users** in the sidebar.
2. Click **Add User**.
3. Fill in the form:

   | Field | Required | Description |
   |-------|----------|-------------|
   | Full Name | Yes | User's display name |
   | Email | Yes | Login email address |
   | Password | Yes | Initial password |
   | Role | Yes | Administrator or Officer |
   | Department | No | User's department |

4. Click **Create User**.
5. Communicate the login credentials to the new user securely.

### 9.3 Change a User's Role

1. Find the user in the list.
2. Click **Edit**.
3. Change the **Role** field.
4. Click **Save**.

### 9.4 Deactivate a User

1. Find the user in the list.
2. Click **Deactivate**.
3. Confirm the action.
4. The user can no longer log in but their historical records are preserved.

---

## 10. Audit Logs

> **Access:** ICT Administrator only

### 10.1 View Audit Logs

1. Click **Audit Logs** in the sidebar.
2. The log displays all system actions with:
   - **User** — who performed the action
   - **Action** — what was done
   - **Entity** — what was affected
   - **Timestamp** — when it occurred

### 10.2 Filter Audit Logs

1. Use the filter options:
   - **User** — filter by specific user
   - **Action** — filter by action type (e.g., `equipment_issued`)
   - **Date Range** — filter by date
2. Click **Apply Filters**.

---

## 11. Common Tasks Quick Reference

| Task | Navigation | Role |
|------|------------|------|
| Issue equipment | Borrow → Issue Equipment | Officer, Admin |
| Record a return | Borrow → Active → Record Return | Officer, Admin |
| Register new equipment | Equipment → Add Equipment | Admin |
| Search for equipment | Equipment → Search bar | Officer, Admin |
| Generate borrowing report | Reports → Borrowing History | Officer, Admin |
| Create user account | Users → Add User | Admin |
| View audit logs | Audit Logs | Admin |

---

## 12. Troubleshooting

### 12.1 Cannot Log In

- Verify your email and password are correct.
- Check that your account is active (contact Administrator).
- Ensure you have an internet connection.
- Clear browser cache and try again.

### 12.2 Cannot Issue Equipment

- Check that the equipment status is **Available**.
- If the item shows as Borrowed, it must be returned first.
- If the item is Under Maintenance or Retired, contact the Administrator.

### 12.3 "Permission Denied" Error

- Your role does not have access to this action.
- Contact your ICT Administrator if you believe you need additional permissions.

### 12.4 Session Expired

- Your login session has timed out.
- Click **Sign In** again to continue.

### 12.5 Page Not Loading

- Check your internet connection.
- Try refreshing the page (F5 or Ctrl+R).
- Try a different browser.
- Contact ICT support if the problem persists.

---

## 13. Glossary

| Term | Definition |
|------|------------|
| **Asset Tag** | Internal identification label assigned by ICT |
| **Borrowing Record** | A transaction log of equipment issued to a borrower |
| **Category** | Equipment classification (Laptop, Projector, etc.) |
| **Dashboard** | Home page showing system summary |
| **Equipment Status** | Current state: Available, Borrowed, Under Maintenance, Retired |
| **Overdue** | A borrowing that has passed its expected return date |
| **RLS** | Row Level Security — database access control |
| **Serial Number** | Manufacturer-assigned unique identifier |

---

## 14. Support

For technical issues or access requests, contact the ICT Department:

- **System Administrator:** ICT Department Head
- **Support Channel:** Internal ICT helpdesk

---

## 15. Related Documentation

| Document | Description |
|----------|-------------|
| [User-Roles.md](./User-Roles.md) | Detailed role permissions |
| [System-Workflow.md](./System-Workflow.md) | Process flow diagrams |
| [Project-Overview.md](./Project-Overview.md) | System overview |
