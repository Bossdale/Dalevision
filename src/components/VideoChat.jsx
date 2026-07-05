import { useEffect, useState } from 'react'
import {
  ControlBar,
  GridLayout,
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
} from '@livekit/components-react'
import { Track } from 'livekit-client'
import '@livekit/components-styles'
import { fetchLiveKitToken, isLiveKitConfigured, liveKitUrl } from '../lib/livekit'

function Tiles() {
  const tracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { onlySubscribed: false },
  )
  return (
    <GridLayout tracks={tracks} style={{ height: 'auto' }}>
      <ParticipantTile />
    </GridLayout>
  )
}

// Camera/mic panel. Gracefully disabled until LiveKit is configured.
export default function VideoChat({ roomId, identity, name }) {
  const [token, setToken] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!isLiveKitConfigured()) return undefined
    let active = true
    fetchLiveKitToken(roomId, identity, name)
      .then((t) => active && setToken(t))
      .catch((e) => active && setErr(String(e.message || e)))
    return () => {
      active = false
    }
  }, [roomId, identity, name])

  if (!isLiveKitConfigured()) {
    return (
      <div className="glass-card p-3 text-xs text-gray-400">
        📷 Camera/mic chat is off. Configure LiveKit to enable it (see{' '}
        <span className="text-gray-300">server/livekit-token-worker</span>).
      </div>
    )
  }
  if (err) return <div className="glass-card p-3 text-xs text-accent">Video chat error: {err}</div>
  if (!token) return <div className="glass-card p-3 text-xs text-gray-400">Connecting camera/mic…</div>

  return (
    <div className="overflow-hidden rounded-xl" data-lk-theme="default">
      <LiveKitRoom serverUrl={liveKitUrl()} token={token} connect video audio>
        <Tiles />
        <RoomAudioRenderer />
        <ControlBar
          variation="minimal"
          controls={{ microphone: true, camera: true, screenShare: false, leave: false }}
        />
      </LiveKitRoom>
    </div>
  )
}
