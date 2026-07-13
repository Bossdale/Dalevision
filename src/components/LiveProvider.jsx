import { createContext, useContext, useEffect, useRef, useState } from 'react'
import {
  LiveKitRoom,
  RoomAudioRenderer,
  StartAudio,
  useLocalParticipant,
  useTracks,
} from '@livekit/components-react'
import { Track } from 'livekit-client'
import '@livekit/components-styles'
import { fetchLiveKitToken, isLiveKitConfigured, liveKitUrl } from '../lib/livekit'

// Shared LiveKit context for the whole Watch Together room, so the host's
// screen-share can be shown as the movie for viewers (not just in the tile
// strip). Also renders the audio sinks (call mic audio + shared screen audio).
const LiveCtx = createContext({ configured: false })
export const useLive = () => useContext(LiveCtx)

function Provide({ children, callVolume, setCallVolume }) {
  const screenTracks = useTracks([Track.Source.ScreenShare], { onlySubscribed: false })
  const camTracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }], {
    onlySubscribed: false,
  })
  const { localParticipant } = useLocalParticipant()

  const [sharing, setSharing] = useState(false)
  const shareRef = useRef({ video: null, audio: null })

  // What viewers should watch as the movie = a remote participant's screen.
  const screen = screenTracks.find((t) => t.publication && !t.participant?.isLocal) || null

  const stopShare = async () => {
    const s = shareRef.current
    try {
      if (s.video) await localParticipant.unpublishTrack(s.video)
      if (s.audio) await localParticipant.unpublishTrack(s.audio)
    } catch {
      /* ignore */
    }
    try {
      s.video?.stop?.()
      s.audio?.stop?.()
    } catch {
      /* ignore */
    }
    shareRef.current = { video: null, audio: null }
    setSharing(false)
  }

  const startShare = async () => {
    // Capture the CURRENT tab (so Region Capture can crop it), with tab audio.
    // NOTE: preferCurrentTab is a TOP-LEVEL option, not a video constraint.
    const stream = await navigator.mediaDevices.getDisplayMedia({
      preferCurrentTab: true,
      video: true,
      audio: true,
    })
    const videoTrack = stream.getVideoTracks()[0]
    const audioTrack = stream.getAudioTracks()[0]

    // If no audio was captured, the host likely didn't share tab audio.
    if (!audioTrack) {
      window.alert(
        'No audio was shared. To share sound, in the picker choose the "Chrome Tab" ' +
          'option and turn ON "Share tab audio", then share again.',
      )
    }

    // Crop the shared stream to just the movie frame (Region Capture). This
    // captures the composited pixels, so it works even though the movie is a
    // cross-origin iframe. (Element Capture / restrictTo blanks cross-origin
    // iframes, so it can't be used here.) The video-call tiles are kept below
    // the movie while sharing, so they fall OUTSIDE this crop rectangle.
    const el = document.querySelector('[data-movie-frame]')
    if (el && window.CropTarget && typeof videoTrack.cropTo === 'function') {
      try {
        const target = await window.CropTarget.fromElement(el)
        await videoTrack.cropTo(target)
      } catch {
        /* region capture unsupported — falls back to full tab */
      }
    }

    await localParticipant.publishTrack(videoTrack, { source: Track.Source.ScreenShare })
    if (audioTrack) {
      await localParticipant.publishTrack(audioTrack, { source: Track.Source.ScreenShareAudio })
    }
    shareRef.current = { video: videoTrack, audio: audioTrack }
    setSharing(true)
    // If the user stops sharing via the browser's own control:
    videoTrack.addEventListener('ended', stopShare)
  }

  const toggleShare = () => (sharing ? stopShare() : startShare().catch(() => setSharing(false)))

  const value = {
    configured: true,
    screen,
    camTracks,
    isLocalSharing: sharing,
    toggleShare,
    callVolume,
    setCallVolume,
  }
  return (
    <LiveCtx.Provider value={value}>
      {children}
      {/* Renders ALL remote audio (voices + shared screen audio) reliably. */}
      <RoomAudioRenderer volume={callVolume} />
      {/* Mobile/iOS block audio autoplay until a tap — this prompt unlocks it
          so phone/tablet viewers can hear the host's shared movie + voices. */}
      <StartAudio
        label="🔊 Tap to enable sound"
        className="fixed bottom-4 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-glow"
      />
    </LiveCtx.Provider>
  )
}

export default function LiveProvider({ roomId, identity, name, children }) {
  const [token, setToken] = useState(null)
  const [callVolume, setCallVolume] = useState(1)

  useEffect(() => {
    if (!isLiveKitConfigured()) return undefined
    let active = true
    fetchLiveKitToken(roomId, identity, name)
      .then((t) => active && setToken(t))
      .catch(() => {})
    return () => {
      active = false
    }
  }, [roomId, identity, name])

  // No LiveKit (or still connecting) → render children without a live context.
  if (!isLiveKitConfigured() || !token) {
    return <LiveCtx.Provider value={{ configured: false }}>{children}</LiveCtx.Provider>
  }

  return (
    <LiveKitRoom
      serverUrl={liveKitUrl()}
      token={token}
      connect
      video
      audio
      className="contents"
    >
      <Provide callVolume={callVolume} setCallVolume={setCallVolume}>
        {children}
      </Provide>
    </LiveKitRoom>
  )
}
