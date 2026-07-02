import { useState } from 'react'
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth'
import { auth } from '../lib/firebase'
import { friendlyAuthError } from '../lib/authErrors'

// Lets the signed-in user change their own password. Firebase requires a recent
// login, so we reauthenticate with the current password first.
export default function ChangePassword() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [msg, setMsg] = useState(null) // { ok: boolean, text: string }
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setMsg(null)

    if (next.length < 6) {
      setMsg({ ok: false, text: 'New password must be at least 6 characters.' })
      return
    }
    if (next !== confirm) {
      setMsg({ ok: false, text: 'New passwords do not match.' })
      return
    }

    setBusy(true)
    try {
      const user = auth.currentUser
      const cred = EmailAuthProvider.credential(user.email, current)
      await reauthenticateWithCredential(user, cred) // verifies current password
      await updatePassword(user, next)
      setMsg({ ok: true, text: 'Password updated successfully.' })
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch (err) {
      const text =
        err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password'
          ? 'Your current password is incorrect.'
          : friendlyAuthError(err.code)
      setMsg({ ok: false, text })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="max-w-md space-y-3">
      {msg && (
        <p
          className={`rounded px-3 py-2 text-sm ${
            msg.ok ? 'bg-green-500/20 text-green-400' : 'bg-accent/20 text-accent'
          }`}
        >
          {msg.text}
        </p>
      )}
      <input
        className="input"
        type="password"
        placeholder="Current password"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        autoComplete="current-password"
        required
      />
      <input
        className="input"
        type="password"
        placeholder="New password (min 6 characters)"
        value={next}
        onChange={(e) => setNext(e.target.value)}
        autoComplete="new-password"
        required
      />
      <input
        className="input"
        type="password"
        placeholder="Confirm new password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        autoComplete="new-password"
        required
      />
      <button className="btn-primary" disabled={busy}>
        {busy ? 'Updating…' : 'Change password'}
      </button>
    </form>
  )
}
