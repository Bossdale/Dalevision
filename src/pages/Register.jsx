import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { DEFAULT_AVATAR } from '../lib/avatars'
import { friendlyAuthError } from '../lib/authErrors'
import AuthShell from '../components/AuthShell'
import TermsModal from '../components/TermsModal'

export default function Register() {
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (displayName.trim().length < 2) {
      setError('Please enter a display name.')
      return
    }
    if (!agreed) {
      setError('Please accept the Terms & Conditions to continue.')
      return
    }
    setBusy(true)
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
      await updateProfile(cred.user, { displayName: displayName.trim() })

      // role/status defaults are also enforced server-side by the create rule —
      // the client value is not trusted.
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        displayName: displayName.trim(),
        email: email.trim(),
        avatar: DEFAULT_AVATAR,
        role: 'user',
        status: 'pending',
        createdAt: serverTimestamp(),
        watchHistory: [],
      })
      // First-time users go straight to avatar selection; from there the guards
      // route them to /pending (or home once approved).
      navigate('/select-avatar', { replace: true })
    } catch (err) {
      console.error('[register] failed:', err.code, err.message, err)
      setError(friendlyAuthError(err.code))
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Create your account"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="text-white hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <p className="rounded bg-accent/20 px-3 py-2 text-sm text-accent">{error}</p>
        )}
        <input
          className="input"
          type="text"
          placeholder="Display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          autoComplete="name"
          required
        />
        <input
          className="input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <input
          className="input"
          type="password"
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          minLength={6}
          required
        />
        <label className="flex items-start gap-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-accent"
          />
          <span>
            I agree to the{' '}
            <button
              type="button"
              onClick={() => setShowTerms(true)}
              className="text-white underline hover:text-accent"
            >
              Terms &amp; Conditions
            </button>
          </span>
        </label>

        <button className="btn-primary w-full" disabled={busy || !agreed}>
          {busy ? 'Creating account…' : 'Sign up'}
        </button>
      </form>
      <p className="mt-4 text-xs text-gray-500">
        New accounts require admin approval before you can browse.
      </p>

      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
    </AuthShell>
  )
}
