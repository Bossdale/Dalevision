import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth, db } from '../lib/firebase'
import { sendApprovalEmail } from '../lib/email'
import { useAuth } from '../contexts/AuthContext'
import Avatar from '../components/Avatar'
import Spinner from '../components/Spinner'

const TABS = ['all', 'pending', 'approved', 'banned']
const ACTIVE_WINDOW_MS = 2 * 60 * 1000 // "Active" if seen within 2 minutes

// lastActive may be a Firestore Timestamp or a number — normalise to ms.
function lastActiveMs(u) {
  const v = u.lastActive
  if (!v) return null
  if (typeof v === 'number') return v
  if (typeof v.toMillis === 'function') return v.toMillis()
  return null
}

const statusBadge = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  approved: 'bg-green-500/20 text-green-400',
  banned: 'bg-red-500/20 text-red-400',
}

export default function Admin() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [tab, setTab] = useState('pending')
  const [search, setSearch] = useState('')
  const [busyId, setBusyId] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const snap = await getDocs(collection(db, 'users'))
      setUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() })))
    } catch {
      setError('Failed to load users. Check your admin role and Firestore rules.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const setStatus = async (uid, status) => {
    setBusyId(uid)
    try {
      await updateDoc(doc(db, 'users', uid), { status })
      setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, status } : u)))
    } catch {
      setError('Update failed.')
    } finally {
      setBusyId(null)
    }
  }

  // Approve a user AND email them the good news (email is a no-op if EmailJS
  // isn't configured).
  const approveUser = async (u) => {
    await setStatus(u.uid, 'approved')
    try {
      const res = await sendApprovalEmail({ toEmail: u.email, toName: u.displayName })
      if (res.ok) setNotice(`Approved ${u.email} — approval email sent.`)
      else if (res.skipped)
        setNotice(`Approved ${u.email}. (Email not configured — skipped.)`)
    } catch {
      setNotice(`Approved ${u.email}, but the approval email failed to send.`)
    }
  }

  const resetPassword = async (email) => {
    setError('')
    setNotice('')
    if (!email) return
    if (!window.confirm(`Send a password-reset link to ${email}?`)) return
    try {
      await sendPasswordResetEmail(auth, email)
      setNotice(`Password-reset link sent to ${email}.`)
    } catch {
      setError(`Could not send reset email to ${email}.`)
    }
  }

  const removeUser = async (uid) => {
    // NOTE: this deletes only the Firestore doc. It does NOT delete the Firebase
    // Auth account — that requires the Admin SDK in a Cloud Function. Banning is
    // the recommended default.
    if (!window.confirm('Delete this user document? (Auth account is not removed.)')) return
    setBusyId(uid)
    try {
      await deleteDoc(doc(db, 'users', uid))
      setUsers((prev) => prev.filter((u) => u.uid !== uid))
    } catch {
      setError('Delete failed.')
    } finally {
      setBusyId(null)
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users
      .filter((u) => (tab === 'all' ? true : u.status === tab))
      .filter(
        (u) =>
          !q ||
          u.displayName?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q),
      )
  }, [users, tab, search])

  const counts = useMemo(
    () => ({
      all: users.length,
      pending: users.filter((u) => u.status === 'pending').length,
      approved: users.filter((u) => u.status === 'approved').length,
      banned: users.filter((u) => u.status === 'banned').length,
    }),
    [users],
  )

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="rounded bg-gray-200 px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-300"
            >
              ‹ Back to Home
            </button>
            <h1 className="text-2xl font-bold">Admin — User Management</h1>
          </div>
          <button
            onClick={load}
            className="rounded bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-gray-700"
          >
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-sm capitalize ${
                tab === t ? 'bg-accent text-white' : 'bg-white text-gray-700 ring-1 ring-gray-300'
              }`}
            >
              {t} ({counts[t]})
            </button>
          ))}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="ml-auto rounded border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>

        {error && (
          <p className="mb-4 rounded bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        {notice && (
          <p className="mb-4 rounded bg-green-100 px-3 py-2 text-sm text-green-700">{notice}</p>
        )}

        {loading ? (
          <Spinner />
        ) : (
          <div className="overflow-x-auto rounded-lg bg-white shadow">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Active</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      No users in this view.
                    </td>
                  </tr>
                )}
                {filtered.map((u) => {
                  const isSelf = u.uid === currentUser?.uid
                  const busy = busyId === u.uid
                  return (
                    <tr key={u.uid} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar id={u.avatar} size={28} />
                          <span className="font-medium">{u.displayName || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{u.email}</td>
                      <td className="px-4 py-3 capitalize">{u.role}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs capitalize ${
                            statusBadge[u.status] || 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        {(() => {
                          const ms = lastActiveMs(u)
                          if (!ms) return <span className="text-gray-400">—</span>
                          if (Date.now() - ms < ACTIVE_WINDOW_MS) {
                            return (
                              <span className="inline-flex items-center gap-1 font-medium text-green-600">
                                <span className="h-2 w-2 rounded-full bg-green-500" />
                                Active
                              </span>
                            )
                          }
                          return (
                            <span className="text-gray-600">
                              {new Date(ms).toLocaleString([], {
                                month: 'numeric',
                                day: 'numeric',
                                year: '2-digit',
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              })}
                            </span>
                          )
                        })()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {u.status !== 'approved' && (
                            <button
                              disabled={busy}
                              onClick={() => approveUser(u)}
                              className="rounded bg-green-600 px-2.5 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              Approve
                            </button>
                          )}
                          {u.status !== 'banned' && !isSelf && (
                            <button
                              disabled={busy}
                              onClick={() => setStatus(u.uid, 'banned')}
                              className="rounded bg-yellow-600 px-2.5 py-1 text-xs text-white hover:bg-yellow-700 disabled:opacity-50"
                            >
                              Ban
                            </button>
                          )}
                          <button
                            disabled={busy}
                            onClick={() => resetPassword(u.email)}
                            className="rounded bg-blue-600 px-2.5 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
                            title="Send a password-reset link to this user's email"
                          >
                            Reset PW
                          </button>
                          {!isSelf && (
                            <button
                              disabled={busy}
                              onClick={() => removeUser(u.uid)}
                              className="rounded bg-red-600 px-2.5 py-1 text-xs text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-4 text-xs text-gray-500">
          Note: “Delete” removes the Firestore document only. Removing the Firebase Auth
          account requires a Cloud Function using the Admin SDK. Banning is recommended.
          “Reset PW” emails the user a Firebase password-reset link (the client SDK can’t
          set another user’s password directly — that also needs a Cloud Function).
        </p>
      </div>
    </div>
  )
}
