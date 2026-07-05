import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'

// Own-player used by Watch Together. The HOST's native controls drive playback
// and emit events; GUESTS have locked controls and follow the room's playback
// state. This works because it's a same-origin <video> (unlike the embeds).
export default function SyncPlayer({ streamUrl, kind, isHost, playback, onHostEvent }) {
  const videoRef = useRef(null)
  const [needGesture, setNeedGesture] = useState(false)

  // Attach the source (hls.js for .m3u8 where MSE is needed, native otherwise).
  useEffect(() => {
    const video = videoRef.current
    if (!video || !streamUrl) return undefined
    let hls
    if (kind === 'hls' && Hls.isSupported()) {
      hls = new Hls({ enableWorker: true })
      hls.loadSource(streamUrl)
      hls.attachMedia(video)
    } else {
      video.src = streamUrl // mp4, or native HLS on Safari
    }
    return () => {
      if (hls) hls.destroy()
    }
  }, [streamUrl, kind])

  // HOST → broadcast play/pause/seek + a heartbeat while playing.
  useEffect(() => {
    if (!isHost) return undefined
    const video = videoRef.current
    if (!video) return undefined
    const emit = () =>
      onHostEvent?.({
        state: video.paused ? 'paused' : 'playing',
        positionSeconds: video.currentTime,
      })
    video.addEventListener('play', emit)
    video.addEventListener('pause', emit)
    video.addEventListener('seeked', emit)
    const hb = setInterval(() => {
      if (!video.paused) emit()
    }, 4000)
    return () => {
      video.removeEventListener('play', emit)
      video.removeEventListener('pause', emit)
      video.removeEventListener('seeked', emit)
      clearInterval(hb)
    }
  }, [isHost, onHostEvent])

  // GUEST → follow the room's playback (snap on >1.5s drift; match play/pause).
  useEffect(() => {
    if (isHost || !playback) return
    const video = videoRef.current
    if (!video) return
    const target = playback.positionSeconds ?? 0
    if (Math.abs(video.currentTime - target) > 1.5) {
      try {
        video.currentTime = target
      } catch {
        /* not seekable yet */
      }
    }
    if (playback.state === 'playing') {
      const p = video.play()
      if (p && p.catch) p.catch(() => setNeedGesture(true)) // autoplay blocked
    } else {
      video.pause()
    }
  }, [isHost, playback])

  const manualSync = () => {
    setNeedGesture(false)
    videoRef.current?.play().catch(() => setNeedGesture(true))
  }

  return (
    <div className="relative w-full">
      <video
        ref={videoRef}
        controls={isHost}
        playsInline
        className="aspect-video w-full rounded-xl bg-black shadow-card ring-1 ring-white/10"
      />
      {!isHost && (
        <span className="pointer-events-none absolute left-3 top-3 rounded bg-black/60 px-2 py-1 text-xs text-gray-200 backdrop-blur-sm">
          Host controls playback
        </span>
      )}
      {needGesture && !isHost && (
        <button
          onClick={manualSync}
          className="absolute inset-0 flex items-center justify-center bg-black/60"
        >
          <span className="btn-primary pointer-events-none">▶ Tap to sync with host</span>
        </button>
      )}
    </div>
  )
}
