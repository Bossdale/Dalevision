import { useCallback, useEffect, useRef, useState } from 'react'

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

export default function SandboxedFrame({
  src,
  title,
  timeoutMs = 8000,
  // Extra automatic remounts before declaring the source dead. A fresh iframe
  // mount is what fixes sources that need a clean load (the same thing a user
  // does by hand when switching servers away and back), so we retry once by
  // default before surfacing the error / advancing to the next source.
  maxAttempts = 1,
  serverLabel,
  // True while the parent is auto-probing servers to find a working one.
  autoProbing = false,
  onLoaded,
  onTimeout,
  onTryNext,
}) {
  const [loaded, setLoaded] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  // Bumping `attempt` changes the iframe key → forces a fresh remount.
  const [attempt, setAttempt] = useState(0)
  const attemptsRef = useRef(0)
  const prevSrc = useRef(src)
  const timer = useRef(null)
  // Keep latest callbacks in refs so re-renders don't reset the load timer.
  const onLoadedRef = useRef(onLoaded)
  const onTimeoutRef = useRef(onTimeout)
  onLoadedRef.current = onLoaded
  onTimeoutRef.current = onTimeout

  // (Re)arm the probe timer whenever the src or a retry attempt changes.
  useEffect(() => {
    if (!src) return undefined
    // A genuinely new src resets the retry budget; a bumped `attempt` (retry or
    // auto-remount) keeps counting against it.
    if (prevSrc.current !== src) {
      prevSrc.current = src
      attemptsRef.current = 0
    }
    setLoaded(false)
    setTimedOut(false)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      if (attemptsRef.current < maxAttempts) {
        // Silent auto-remount: give the source one clean reload before we give
        // up on it. This is the automated version of "switch server and back".
        attemptsRef.current += 1
        setAttempt((a) => a + 1)
      } else {
        setTimedOut(true)
        onTimeoutRef.current?.()
      }
    }, timeoutMs)
    return () => clearTimeout(timer.current)
  }, [src, timeoutMs, attempt, maxAttempts])

  const onLoad = () => {
    setLoaded(true)
    setTimedOut(false)
    clearTimeout(timer.current)
    onLoadedRef.current?.()
  }

  // Manual retry: reset the budget and force a fresh iframe mount.
  const retry = useCallback(() => {
    attemptsRef.current = 0
    setLoaded(false)
    setTimedOut(false)
    setAttempt((a) => a + 1)
  }, [])

  const loadingLabel = autoProbing
    ? 'Finding a working source…'
    : `Loading ${serverLabel || 'source'}…`
  const retrying = attempt > 0 && !loaded && !timedOut

  return (
    <div className="relative h-full w-full bg-black">
      {!loaded && !timedOut && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-700 border-t-accent" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-200">{loadingLabel}</p>
            {retrying ? (
              <p className="text-xs text-gray-500">Reloading this source…</p>
            ) : autoProbing && serverLabel ? (
              <p className="text-xs text-gray-500">Trying {serverLabel}</p>
            ) : null}
          </div>
        </div>
      )}

      {timedOut && !loaded && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 px-6 text-center text-gray-300">
          <p className="text-lg font-semibold">
            {serverLabel ? `${serverLabel} didn’t load` : 'This source didn’t load'}
          </p>
          <p className="max-w-md text-sm text-gray-500">
            The embed may be down or blocked. Reload it, or try another server.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={retry}
              className="rounded bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-hover"
            >
              ↻ Retry
            </button>
            {onTryNext && (
              <button
                onClick={onTryNext}
                className="rounded bg-white/10 px-4 py-2 text-sm text-gray-200 transition hover:bg-white/20"
              >
                Try next server ›
              </button>
            )}
          </div>
        </div>
      )}

      {src && (
        <iframe
          key={`${src}#${attempt}`}
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
