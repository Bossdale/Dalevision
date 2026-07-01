import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Spinner from './Spinner'

// Requires an APPROVED user. Routes pending/banned users to their screens.
// Note: this is UX only — real enforcement is in the Firestore rules.
export default function ApprovedRoute() {
  const { currentUser, userProfile, loading } = useAuth()

  if (loading) return <Spinner full label="Loading your account…" />
  if (!currentUser) return <Navigate to="/login" replace />
  if (!userProfile) return <Spinner full label="Loading your account…" />

  if (userProfile.status === 'banned') return <Navigate to="/banned" replace />
  if (userProfile.status !== 'approved') return <Navigate to="/pending" replace />

  return <Outlet />
}
