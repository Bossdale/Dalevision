import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { friendlyAuthError } from '../lib/authErrors'
import { getRememberedUser } from '../lib/rememberedUser'
import AuthShell from '../components/AuthShell'
import Avatar from '../components/Avatar'

export default function Login() {
  const navigate = useNavigate()
  const remembered = getRememberedUser()

  // Show the "welcome back" card when we have a remembered user and the user
  // hasn't chosen "use a different account".
  const [useAnother, setUseAnother] = useState(!remembered)
  const [revealed, setRevealed] = useState(false) // password field shown after clicking the profile
  const [email, setEmail] = useState(remembered?.email || '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  const forgotPassword = async (targetEmail) => {
    setError('')
    setInfo('')
    const addr = (targetEmail || '').trim()
    if (!addr) {
      setError('Enter your email above first, then tap “Forgot password?”.')
      return
    }
    try {
      await sendPasswordResetEmail(auth, addr)
      setInfo(`Password-reset link sent to ${addr}. Check your inbox.`)
    } catch (err) {
      setError(friendlyAuthError(err.code))
    }
  }

  const signIn = async (loginEmail) => {
    setError('')
    setBusy(true)
    try {
      await signInWithEmailAndPassword(auth, loginEmail.trim(), password)
      // Route decisions happen in the guards once AuthContext loads the profile.
      navigate('/', { replace: true })
    } catch (err) {
      console.error('[login] failed:', err.code, err.message, err)
      setError(friendlyAuthError(err.code))
      setBusy(false)
    }
  }

  // --- Welcome-back view (returning user on this device) ---
  // Big circular profile + name, no container. Click the profile to reveal the
  // password box + sign-in button below it.
  if (remembered && !useAnother) {
    return (
      <div className="relative flex min-h-screen flex-col text-white">
        {/* living ambient gradient blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-blob-a absolute -left-24 -top-24 h-72 w-72 rounded-full bg-accent/40 blur-3xl" />
          <div className="animate-blob-b absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-accent-dark/40 blur-3xl" />
          <div className="animate-blob-c absolute left-1/3 top-1/2 h-64 w-64 rounded-full bg-accent/25 blur-3xl" />
        </div>

        <header className="relative p-6">
          <Link
            to="/"
            className="bg-accent-gradient bg-clip-text font-display text-3xl tracking-wide text-transparent"
          >
            DALEVISION
          </Link>
        </header>

        <main className="relative flex flex-1 flex-col items-center justify-center px-4 pb-16">
          {/* Clickable circular profile + display name (no container) */}
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="group flex flex-col items-center gap-5"
            aria-label="Select profile to sign in"
          >
            <div className="h-48 w-48 overflow-hidden rounded-full ring-4 ring-white/15 shadow-2xl transition duration-200 group-hover:scale-105 group-hover:ring-accent">
              <Avatar id={remembered.avatar} size={192} className="!rounded-none" />
            </div>
            <span className="font-display text-4xl tracking-wide text-shadow sm:text-5xl">
              {remembered.displayName || remembered.email}
            </span>
          </button>

          {!revealed && (
            <p className="mt-3 text-sm text-gray-400">Click your profile to sign in</p>
          )}

          {/* Password + sign in — revealed below the profile on click */}
          {revealed && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                signIn(remembered.email)
              }}
              className="mt-7 w-full max-w-sm animate-fade-in-up space-y-3"
            >
              {error && (
                <p className="rounded bg-accent/20 px-3 py-2 text-center text-sm text-accent">
                  {error}
                </p>
              )}
              {info && (
                <p className="rounded bg-green-500/20 px-3 py-2 text-center text-sm text-green-400">
                  {info}
                </p>
              )}
              <input
                className="input text-center"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                autoFocus
                required
              />
              <button className="btn-primary w-full" disabled={busy}>
                {busy ? 'Signing in…' : 'Sign in'}
              </button>
              <button
                type="button"
                onClick={() => forgotPassword(remembered.email)}
                className="w-full text-center text-sm text-gray-400 hover:text-white"
              >
                Forgot password?
              </button>
            </form>
          )}

          <button
            type="button"
            onClick={() => {
              setUseAnother(true)
              setRevealed(false)
              setPassword('')
              setError('')
            }}
            className="mt-8 text-sm text-gray-400 hover:text-white"
          >
            Sign in as a different account
          </button>
        </main>
      </div>
    )
  }

  // --- Standard login form (first time / different account) ---
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
      <form
        onSubmit={(e) => {
          e.preventDefault()
          signIn(email)
        }}
        className="space-y-4"
      >
        {error && (
          <p className="rounded bg-accent/20 px-3 py-2 text-sm text-accent">{error}</p>
        )}
        {info && (
          <p className="rounded bg-green-500/20 px-3 py-2 text-sm text-green-400">{info}</p>
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
        <button
          type="button"
          onClick={() => forgotPassword(email)}
          className="w-full text-center text-sm text-gray-400 hover:text-white"
        >
          Forgot password?
        </button>

        {remembered && (
          <button
            type="button"
            onClick={() => {
              setUseAnother(false)
              setEmail(remembered.email)
              setPassword('')
              setError('')
            }}
            className="w-full text-center text-sm text-gray-400 hover:text-white"
          >
            ‹ Back to {remembered.displayName || remembered.email}
          </button>
        )}
      </form>
    </AuthShell>
  )
}
