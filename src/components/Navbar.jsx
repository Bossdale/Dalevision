import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Avatar from './Avatar'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/movies', label: 'Movies' },
  { to: '/series', label: 'Series' },
  { to: '/search', label: 'Search' },
  { to: '/watch-together', label: 'Watch Together' },
]

export default function Navbar() {
  const { userProfile, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)
  const dropRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onClick = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const onLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const linkClass = ({ isActive }) =>
    `text-sm transition-colors ${
      isActive ? 'text-white font-semibold' : 'text-gray-300 hover:text-white'
    }`

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'border-b border-white/10 bg-ink/70 shadow-lg backdrop-blur-xl'
          : 'bg-gradient-to-b from-black/80 to-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="bg-accent-gradient bg-clip-text font-display text-3xl tracking-wide text-transparent drop-shadow"
          >
            DALEVISION
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
                {l.label}
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink to="/admin" className={linkClass}>
                Admin
              </NavLink>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Avatar dropdown */}
          <div className="relative" ref={dropRef}>
            <button
              onClick={() => setDropOpen((o) => !o)}
              className="flex items-center gap-2"
              aria-haspopup="menu"
              aria-expanded={dropOpen}
            >
              <Avatar id={userProfile?.avatar} size={34} />
              <span className="hidden text-sm text-gray-200 sm:inline">
                {userProfile?.displayName || 'Account'}
              </span>
            </button>
            {dropOpen && (
              <div className="glass-strong absolute right-0 mt-2 w-44 animate-fade-in overflow-hidden rounded-xl py-1 shadow-xl">
                <Link
                  to="/profile"
                  onClick={() => setDropOpen(false)}
                  className="block px-4 py-2 text-sm text-gray-200 hover:bg-white/10"
                >
                  Profile
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setDropOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-200 hover:bg-white/10"
                  >
                    Admin panel
                  </Link>
                )}
                <button
                  onClick={onLogout}
                  className="block w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-white/10"
                >
                  Log out
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-gray-200"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            ☰
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="glass-strong animate-fade-in border-t border-white/10 px-4 py-2 md:hidden">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              onClick={() => setMenuOpen(false)}
              className="block py-2 text-sm text-gray-200"
            >
              {l.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink
              to="/admin"
              onClick={() => setMenuOpen(false)}
              className="block py-2 text-sm text-gray-200"
            >
              Admin
            </NavLink>
          )}
        </div>
      )}
    </header>
  )
}
