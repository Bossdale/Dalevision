import { useState } from 'react'
import { Link } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import Avatar from '../components/Avatar'
import AvatarPicker from '../components/AvatarPicker'
import ChangePassword from '../components/ChangePassword'
import { IMG } from '../lib/tmdb'
import { clearWatchHistory } from '../lib/watchHistory'

export default function Profile() {
  const { currentUser, userProfile } = useAuth()
  const [displayName, setDisplayName] = useState(userProfile?.displayName ?? '')
  const [avatar, setAvatar] = useState(userProfile?.avatar ?? 'avatar1')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const history = userProfile?.watchHistory ?? []

  const save = async () => {
    setMsg('')
    setSaving(true)
    try {
      // Only profile fields — never role/status (rules would reject those anyway).
      await updateDoc(doc(db, 'users', currentUser.uid), {
        displayName: displayName.trim() || userProfile.displayName,
        avatar,
      })
      setMsg('Saved!')
    } catch {
      setMsg('Could not save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const onClearHistory = async () => {
    await clearWatchHistory(currentUser.uid).catch(() => {})
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 font-display text-4xl tracking-wide">Your Profile</h1>

      <div className="glass-card mb-6 flex items-center gap-4 p-4">
        <Avatar id={avatar} size={64} />
        <div>
          <p className="text-lg font-semibold">{userProfile?.displayName}</p>
          <p className="text-sm text-gray-400">{userProfile?.email}</p>
        </div>
      </div>

      <label className="mb-2 block text-sm text-gray-400">Display name</label>
      <input
        className="input mb-6 max-w-md"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="Display name"
      />

      <p className="mb-3 text-sm text-gray-400">Choose an avatar</p>
      <div className="mb-6">
        <AvatarPicker value={avatar} onChange={setAvatar} />
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        {msg && <span className="text-sm text-gray-400">{msg}</span>}
      </div>

      {/* Change password */}
      <section className="mt-12">
        <h2 className="section-title mb-4">Change Password</h2>
        <ChangePassword />
      </section>

      {/* Watch history */}
      <section className="mt-12">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="section-title">Watch History</h2>
          {history.length > 0 && (
            <button onClick={onClearHistory} className="text-sm text-gray-400 hover:text-white">
              Clear history
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <p className="text-sm text-gray-500">You haven’t watched anything yet.</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {history.map((h) => (
              <Link
                key={`${h.id}-${h.type}-${h.watchedAt}`}
                to={`/detail/${h.type}/${h.id}`}
                className="w-28 shrink-0"
                title={h.title}
              >
                {IMG.poster(h.posterPath) ? (
                  <img
                    src={IMG.poster(h.posterPath)}
                    alt={h.title}
                    className="h-40 w-28 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-40 w-28 items-center justify-center rounded bg-surface p-2 text-center text-xs text-gray-500">
                    {h.title}
                  </div>
                )}
                <p className="mt-1 line-clamp-1 text-xs text-gray-300">{h.title}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
