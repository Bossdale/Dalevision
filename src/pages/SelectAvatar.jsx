import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import AvatarPicker from '../components/AvatarPicker'
import Avatar from '../components/Avatar'
import Spinner from '../components/Spinner'

// First-time onboarding step: pick an avatar right after registering.
// Accessible to signed-in users of ANY status (pending users can set their
// avatar too — the Firestore rules allow updating your own avatar field).
export default function SelectAvatar() {
  const { currentUser, userProfile, loading } = useAuth()
  const navigate = useNavigate()
  const [avatar, setAvatar] = useState(userProfile?.avatar || 'avatar1')
  const [saving, setSaving] = useState(false)

  if (loading) return <Spinner full />
  if (!currentUser) return <Navigate to="/login" replace />

  const finish = async () => {
    setSaving(true)
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { avatar })
    } catch {
      /* non-fatal — they can change it later in Profile */
    } finally {
      // Guards will route to /pending or / based on approval status.
      navigate('/', { replace: true })
    }
  }

  return (
    <div className="relative min-h-screen text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
        <div className="absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-accent-dark/30 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6 flex items-center gap-4">
          <Avatar id={avatar} size={72} className="ring-2 ring-accent" />
          <div>
            <h1 className="font-display text-4xl tracking-wide">Pick your avatar</h1>
            <p className="text-sm text-gray-400">
              Welcome{userProfile?.displayName ? `, ${userProfile.displayName}` : ''}! Choose a
              face for your profile — you can change it anytime.
            </p>
          </div>
        </div>

        <div className="glass-card p-5">
          <AvatarPicker value={avatar} onChange={setAvatar} />
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={finish} disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Continue'}
          </button>
          <button onClick={() => navigate('/', { replace: true })} className="btn-ghost">
            Skip for now
          </button>
        </div>
      </div>
    </div>
  )
}
