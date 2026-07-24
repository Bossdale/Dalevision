import { useEffect, useRef, useState } from 'react'

// Full-screen logo-animation splash. Plays once, then fades out smoothly and
// calls onFinish. Skippable, with a safety timeout in case the video stalls.
export default function Splash({
  onFinish,
  src = '/intro.mp4',
  // Safety net if the video stalls/blocks. Must exceed the intro's real length
  // (~10s) so a normally-playing intro isn't cut short before "ended" fires.
  maxMs = 12000,
}) {
  const [fading, setFading] = useState(false)
  const done = useRef(false)
  const videoRef = useRef(null)

  const finish = () => {
    if (done.current) return
    done.current = true
    setFading(true)
    // Wait for the fade-out transition before unmounting.
    setTimeout(onFinish, 700)
  }

  useEffect(() => {
    // Play WITH sound. Browsers block unmuted autoplay without a prior user
    // gesture, so if that's rejected we retry muted so the intro still plays.
    const v = videoRef.current
    if (v) {
      v.muted = false
      v.play().catch(() => {
        v.muted = true
        v.play().catch(finish)
      })
    }
    // Fallback: if the video never fires "ended" (blocked/stalled), finish anyway.
    const t = setTimeout(finish, maxMs)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black transition-opacity duration-700 ease-out ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <video
        ref={videoRef}
        src={src}
        playsInline
        onEnded={finish}
        onError={finish}
        className="h-full w-full object-cover"
      />
      <button
        onClick={finish}
        className="absolute bottom-6 right-6 text-xs text-white/50 transition-colors hover:text-white"
      >
        Skip ›
      </button>
    </div>
  )
}
