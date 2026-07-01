import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import AuthShell from '../components/AuthShell'
import Spinner from '../components/Spinner'

export default function Pending() {
  const { currentUser, userProfile, loading, logout } = useAuth()

  if (loading) return <Spinner full />
  if (!currentUser) return <Navigate to="/login" replace />
  // If already approved/banned, don't sit on the pending screen.
  if (userProfile?.status === 'approved') return <Navigate to="/" replace />
  if (userProfile?.status === 'banned') return <Navigate to="/banned" replace />

  return (
    <AuthShell title="Awaiting approval">
      <p className="text-gray-300">
        Thanks for signing up{userProfile?.displayName ? `, ${userProfile.displayName}` : ''}!
        Your account is awaiting admin approval.
      </p>
      <p className="mt-3 text-sm text-gray-500">
        This page updates automatically the moment an admin approves you — no need to
        refresh or sign in again.
      </p>
      <button onClick={logout} className="btn-secondary mt-6 w-full">
        Log out
      </button>
    </AuthShell>
  )
}
