import { useEffect, useRef, useState } from 'react'

/**
 * Strictly sandboxed iframe used for both the video player and the download page.
 *
 * Security model (the important part):
 *  - sandbox="allow-scripts allow-same-origin" DELIBERATELY omits allow-popups,
 *    allow-popups-to-escape-sandbox, allow-top-navigation(-by-user-activation),
 *    allow-modals and allow-forms. That omission is what blocks pop-ups and
 *    redirects from the embedded third-party page.
 *  - allow-scripts + allow-same-origin together is safe here ONLY because the
 *    embed is cross-origin; the child cannot reach the parent DOM to strip its
 *    own sandbox (that footgun applies to same-origin framing).
 *  - CSP frame-src (set via Firebase Hosting headers) is a SEPARATE control that
 *    limits which domains this page may frame — it does not stop child popups.
 */
export default function SandboxedFrame({ src, title, timeoutMs = 8000 }) {
  const [loaded, setLoaded] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const timer = useRef(null)

  useEffect(() => {
    setLoaded(false)
    setTimedOut(false)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setTimedOut(true), timeoutMs)
    return () => clearTimeout(timer.current)
  }, [src, timeoutMs])

  const onLoad = () => {
    setLoaded(true)
    setTimedOut(false)
    clearTimeout(timer.current)
  }

  return (
    <div className="relative h-full w-full bg-black">
      {!loaded && !timedOut && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-700 border-t-accent" />
        </div>
      )}

      {timedOut && !loaded && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 px-6 text-center text-gray-300">
          <p className="text-lg font-semibold">This source didn’t load</p>
          <p className="max-w-md text-sm text-gray-500">
            The embed may be down or blocked. Try an alternate source, or go back and
            try again.
          </p>
        </div>
      )}

      {src && (
        <iframe
          key={src}
          src={src}
          title={title}
          onLoad={onLoad}
          className="h-full w-full border-0"
          sandbox="allow-scripts allow-same-origin"
          referrerPolicy="no-referrer"
          allowFullScreen
        />
      )}
    </div>
  )
}
