import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import AuthShell from '../components/AuthShell'
import Spinner from '../components/Spinner'

export default function Banned() {
  const { currentUser, userProfile, loading, logout } = useAuth()

  if (loading) return <Spinner full />
  if (!currentUser) return <Navigate to="/login" replace />
  if (userProfile && userProfile.status !== 'banned') return <Navigate to="/" replace />

  return (
    <AuthShell title="Account suspended">
      <p className="text-gray-300">
        Your account has been suspended. If you believe this is a mistake, please contact
        the administrator.
      </p>
      <button onClick={logout} className="btn-secondary mt-6 w-full">
        Log out
      </button>
    </AuthShell>
  )
}
