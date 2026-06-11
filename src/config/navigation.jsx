const icon = (paths) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    {paths}
  </svg>
)

const dashboardItem = {
  to: '/app/dashboard',
  label: 'Dashboard',
  icon: icon(
    <>
      <path d="M3 9l9-6 9 6" />
      <path d="M9 22V12h6v10" />
    </>
  )
}

const equipmentItem = {
  to: '/app/equipment',
  label: 'Equipment',
  icon: icon(
    <>
      <path d="M4 7h16" />
      <path d="M6 7v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7" />
      <path d="M9 11h6" />
    </>
  )
}

const borrowRequestsItem = {
  to: '/app/borrow-requests',
  label: 'Borrow Requests',
  icon: icon(
    <>
      <path d="M12 13V8" />
      <path d="M16 13V8" />
      <path d="M8 13V8" />
      <path d="M4 6h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z" />
    </>
  )
}

const borrowingsItem = {
  to: '/app/borrowings',
  label: 'Borrowings & Assignments',
  icon: icon(
    <>
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 0" />
      <path d="M3 9a4 4 0 0 1 4-4h9l5 0" />
      <path d="M8 13l3-3 3 3" />
    </>
  )
}

const reportsItem = {
  to: '/app/reports',
  label: 'Reports',
  icon: icon(
    <>
      <path d="M4 19V5a2 2 0 0 1 2-2h10l4 4v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <path d="M14 3v4h4" />
      <path d="M8 13h8" />
      <path d="M8 17h6" />
      <path d="M8 9h3" />
    </>
  )
}

const usersItem = {
  to: '/app/users',
  label: 'Users',
  section: 'Administration',
  icon: icon(
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  )
}

const auditLogsItem = {
  to: '/app/audit-logs',
  label: 'Audit Logs',
  section: 'Administration',
  icon: icon(
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
      <path d="M10 9H8" />
    </>
  )
}

const settingsItem = {
  to: '/app/settings',
  label: 'Settings',
  section: 'Administration',
  icon: icon(
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </>
  )
}

const officerItems = [dashboardItem, equipmentItem, borrowRequestsItem, borrowingsItem, reportsItem]

const adminItems = [
  ...officerItems,
  usersItem,
  auditLogsItem,
  settingsItem
]

export const navItemsByRole = {
  staff: [dashboardItem, borrowRequestsItem],
  officer: officerItems,
  admin: adminItems
}

export function canAccessOfficerModules(role) {
  return role === 'admin' || role === 'officer'
}

export function isAdmin(role) {
  return role === 'admin'
}
