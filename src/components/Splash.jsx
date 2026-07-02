import { useEffect, useRef, useState } from 'react'

// Full-screen logo-animation splash. Plays once, then fades out smoothly and
// calls onFinish. Skippable, with a safety timeout in case the video stalls.
export default function Splash({
  onFinish,
  src = '/DaleVision_logo_animation.mp4',
  maxMs = 9000,
}) {
  const [fading, setFading] = useState(false)
  const done = useRef(false)

  const finish = () => {
    if (done.current) return
    done.current = true
    setFading(true)
    // Wait for the fade-out transition before unmounting.
    setTimeout(onFinish, 700)
  }

  useEffect(() => {
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
        src={src}
        autoPlay
        muted
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
