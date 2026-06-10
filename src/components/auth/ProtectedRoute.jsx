import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import LoadingScreen from '../ui/LoadingScreen.jsx'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, loading } = useAuth()

  if (loading) return <LoadingScreen />

  if (!user) return <Navigate to="/login" replace />

  if (allowedRoles?.length > 0) {
    if (!role || !allowedRoles.includes(role)) {
      return <Navigate to="/app/dashboard" replace />
    }
  }

  return children ?? <Outlet />
}
