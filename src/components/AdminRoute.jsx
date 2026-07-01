import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Spinner from './Spinner'

// Requires role === "admin". UX guard only — Firestore rules are the real gate.
export default function AdminRoute() {
  const { currentUser, userProfile, loading } = useAuth()

  if (loading) return <Spinner full label="Checking permissions…" />
  if (!currentUser) return <Navigate to="/login" replace />
  if (userProfile?.role !== 'admin') return <Navigate to="/" replace />

  return <Outlet />
}
