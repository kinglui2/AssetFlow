import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage.jsx'
import SignupPage from './pages/auth/SignupPage.jsx'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx'
import AppLayout from './components/layout/AppLayout.jsx'
import ProtectedRoute from './components/auth/ProtectedRoute.jsx'
import LoadingScreen from './components/ui/LoadingScreen.jsx'
import DashboardPage from './pages/dashboard/DashboardPage.jsx'
import EquipmentPage from './pages/dashboard/EquipmentPage.jsx'
import BorrowRequestsPage from './pages/dashboard/BorrowRequestsPage.jsx'
import BorrowingsPage from './pages/dashboard/BorrowingsPage.jsx'
import ReportsPage from './pages/dashboard/ReportsPage.jsx'
import UsersPage from './pages/dashboard/UsersPage.jsx'
import AuditLogsPage from './pages/dashboard/AuditLogsPage.jsx'
import SettingsPage from './pages/dashboard/SettingsPage.jsx'
import { useAuth } from './context/AuthContext.jsx'

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  return <Navigate to={user ? '/app/dashboard' : '/login'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      <Route
        path="/app/*"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<DashboardPage />} />

        <Route
          path="equipment"
          element={
            <ProtectedRoute allowedRoles={['admin', 'officer']}>
              <EquipmentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="borrow-requests"
          element={
            <ProtectedRoute allowedRoles={['admin', 'officer', 'staff']}>
              <BorrowRequestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="borrowings"
          element={
            <ProtectedRoute allowedRoles={['admin', 'officer']}>
              <BorrowingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="reports"
          element={
            <ProtectedRoute allowedRoles={['admin', 'officer']}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="audit-logs"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
