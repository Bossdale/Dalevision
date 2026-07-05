import { useEffect, useState } from 'react'

// A small note that slides in from the LEFT edge, stays ~30s, then slides back
// out. Shows once per browser session (first session use), anchored to the left
// so it never drifts to the middle.
const SESSION_KEY = 'dalevision:adblockNoticeSeen'
const VISIBLE_MS = 30000

export default function AdblockNotice() {
  const [mounted, setMounted] = useState(false) // present in the DOM
  const [shown, setShown] = useState(false) // slid-in (true) vs off-screen (false)

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return undefined
    sessionStorage.setItem(SESSION_KEY, '1')
    setMounted(true)

    const slideIn = setTimeout(() => setShown(true), 500) // enter shortly after load
    const slideOut = setTimeout(() => setShown(false), 500 + VISIBLE_MS) // hide after 30s
    const unmount = setTimeout(() => setMounted(false), 500 + VISIBLE_MS + 600)

    return () => {
      clearTimeout(slideIn)
      clearTimeout(slideOut)
      clearTimeout(unmount)
    }
  }, [])

  if (!mounted) return null

  const dismiss = () => {
    setShown(false)
    setTimeout(() => setMounted(false), 600)
  }

  return (
    <div
      className={`fixed bottom-6 left-4 z-40 w-[min(20rem,calc(100vw-2rem))] transition-all duration-500 ease-out ${
        shown ? 'translate-x-0 opacity-100' : '-translate-x-[120%] opacity-0'
      }`}
      role="status"
    >
      <div className="glass-card relative overflow-hidden p-4 pl-5">
        {/* accent left rail */}
        <span className="absolute inset-y-0 left-0 w-1 bg-accent-gradient" />
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute right-2 top-2 text-gray-400 transition-colors hover:text-white"
        >
          ×
        </button>
        <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-white">
          <span>📌</span> Pop-up tip
        </p>
        <p className="text-sm leading-relaxed text-gray-300">
          Getting pop-ups while watching? For a smoother, pop-up-free experience, use{' '}
          <span className="font-semibold text-white">uBlock Origin</span> or the{' '}
          <span className="font-semibold text-white">Brave</span> browser.
        </p>
      </div>
    </div>
  )
}
