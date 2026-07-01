import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Spinner from './Spinner'

// Requires a signed-in user. Redirects to /login otherwise.
export default function PrivateRoute() {
  const { currentUser, loading } = useAuth()

  if (loading) return <Spinner full label="Signing you in…" />
  if (!currentUser) return <Navigate to="/login" replace />
  return <Outlet />
}
