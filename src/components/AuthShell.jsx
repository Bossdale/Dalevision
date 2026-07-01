import { Link } from 'react-router-dom'

// Shared centered glass-card layout for auth-style pages.
export default function AuthShell({ title, children, footer }) {
  return (
    <div className="relative flex min-h-screen flex-col text-white">
      {/* Ambient gradient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
        <div className="absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-accent-dark/30 blur-3xl" />
      </div>

      <header className="relative p-6">
        <Link
          to="/"
          className="bg-accent-gradient bg-clip-text font-display text-3xl tracking-wide text-transparent"
        >
          DALEVISION
        </Link>
      </header>

      <main className="relative flex flex-1 items-center justify-center px-4 pb-10">
        <div className="glass-card w-full max-w-md animate-fade-in-up p-8">
          {title && <h1 className="mb-6 text-2xl font-bold">{title}</h1>}
          {children}
          {footer && <div className="mt-6 text-sm text-gray-400">{footer}</div>}
        </div>
      </main>
    </div>
  )
}
