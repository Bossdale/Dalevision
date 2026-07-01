import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { friendlyAuthError } from '../lib/authErrors'
import AuthShell from '../components/AuthShell'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
      // Do NOT read status inline here — AuthContext populates the profile
      // asynchronously. Just go home; the route guards handle pending/banned/
      // approved routing once the profile resolves.
      navigate('/', { replace: true })
    } catch (err) {
      console.error('[login] failed:', err.code, err.message, err)
      setError(friendlyAuthError(err.code))
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Sign in"
      footer={
        <>
          New to Dalevision?{' '}
          <Link to="/register" className="text-white hover:underline">
            Create an account
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
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthShell>
  )
}
