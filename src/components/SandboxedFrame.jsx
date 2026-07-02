import { useEffect, useRef, useState } from 'react'

/**
 * Sandboxed iframe used for both the video player and the download page.
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

// How much the embedded source is allowed to do:
//  'strict'   – block pop-ups AND tab redirects (max protection; some sources
//               refuse to play).
//  'balanced' – allow pop-ups + forms so the source works, but STILL block
//               main-tab redirects (no allow-top-navigation) and keep any
//               pop-up sandboxed (no allow-popups-to-escape-sandbox). Pop-ups
//               can open, but they can't hijack/redirect your tab. RECOMMENDED.
//  'off'      – no sandbox at all (source fully unrestricted; max malvertising
//               risk). Only for testing.
const SANDBOX_MODE = 'off'

const SANDBOX_TOKENS = {
  strict: 'allow-scripts allow-same-origin',
  balanced: 'allow-scripts allow-same-origin allow-popups allow-forms',
}

export default function SandboxedFrame({ src, title, timeoutMs = 8000, onLoaded, onTimeout }) {
  const [loaded, setLoaded] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const timer = useRef(null)
  // Keep latest callbacks in refs so re-renders don't reset the load timer.
  const onLoadedRef = useRef(onLoaded)
  const onTimeoutRef = useRef(onTimeout)
  onLoadedRef.current = onLoaded
  onTimeoutRef.current = onTimeout

  useEffect(() => {
    setLoaded(false)
    setTimedOut(false)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setTimedOut(true)
      onTimeoutRef.current?.()
    }, timeoutMs)
    return () => clearTimeout(timer.current)
  }, [src, timeoutMs])

  const onLoad = () => {
    setLoaded(true)
    setTimedOut(false)
    clearTimeout(timer.current)
    onLoadedRef.current?.()
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
          referrerPolicy="no-referrer"
          allowFullScreen
          // 'off' omits the sandbox entirely; otherwise apply the mode's tokens.
          {...(SANDBOX_MODE === 'off' ? {} : { sandbox: SANDBOX_TOKENS[SANDBOX_MODE] })}
        />
      )}
    </div>
  )
}
