import { useEffect, useState } from 'react'
import {
  AudioTrack,
  LiveKitRoom,
  ParticipantTile,
  TrackToggle,
  useTracks,
} from '@livekit/components-react'
import { Track } from 'livekit-client'
import '@livekit/components-styles'
import { fetchLiveKitToken, isLiveKitConfigured, liveKitUrl } from '../lib/livekit'
import Avatar from './Avatar'

// Every participant gets a tile (camera OR avatar when camera is off), lined up
// horizontally — no speaker-focus, muted users still shown. `avatars` maps
// participant identity (uid) → Dalevision avatar id.
function TileStrip({ avatars }) {
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }], {
    onlySubscribed: false,
  })
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto">
      {tracks.map((t) => {
        const p = t.participant
        const camOff = !t.publication || t.publication.isMuted
        return (
          <div
            key={`${p.identity}-${t.source}`}
            className="relative h-28 w-40 shrink-0 overflow-hidden rounded-lg bg-black sm:h-32 sm:w-48"
          >
            {camOff ? (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-b from-surface to-black">
                <Avatar id={avatars?.[p.identity]} size={52} />
                <span className="max-w-full truncate px-2 text-xs text-gray-300">
                  {p.name || 'Guest'}
                </span>
              </div>
            ) : (
              <ParticipantTile trackRef={t} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// Render remote mic audio with an adjustable master volume (excludes local mic
// to avoid echo). Replaces RoomAudioRenderer so we can control call volume.
function CallAudio({ volume }) {
  const tracks = useTracks([Track.Source.Microphone], { onlySubscribed: true })
  return (
    <>
      {tracks
        .filter((t) => !t.participant.isLocal && t.publication)
        .map((t) => (
          <AudioTrack key={t.participant.identity} trackRef={t} volume={volume} />
        ))}
    </>
  )
}

function Controls({ callVolume, setCallVolume, floating, setFloating }) {
  const btn = 'rounded bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20'
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <TrackToggle source={Track.Source.Microphone} className={btn}>
        Mic
      </TrackToggle>
      <TrackToggle source={Track.Source.Camera} className={btn}>
        Cam
      </TrackToggle>
      <label className="flex items-center gap-1.5 text-xs text-gray-300">
        🔊 Call
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={callVolume}
          onChange={(e) => setCallVolume(Number(e.target.value))}
          className="accent-accent"
        />
      </label>
      <button onClick={() => setFloating((f) => !f)} className={`${btn} ml-auto`}>
        {floating ? 'Dock ▾' : 'Float ▴'}
      </button>
    </div>
  )
}

// Camera/mic panel. Gracefully disabled until LiveKit is configured.
export default function VideoChat({ roomId, identity, name, avatars }) {
  const [token, setToken] = useState(null)
  const [err, setErr] = useState('')
  const [callVolume, setCallVolume] = useState(1)
  const [floating, setFloating] = useState(false)

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
    <LiveKitRoom serverUrl={liveKitUrl()} token={token} connect video audio className="contents">
      <CallAudio volume={callVolume} />
      <div
        className={
          floating
            ? 'fixed inset-x-0 bottom-3 z-50 mx-auto w-full max-w-4xl px-3'
            : ''
        }
        data-lk-theme="default"
      >
        <div className="glass-card p-2">
          <TileStrip avatars={avatars} />
          <Controls
            callVolume={callVolume}
            setCallVolume={setCallVolume}
            floating={floating}
            setFloating={setFloating}
          />
        </div>
      </div>
    </LiveKitRoom>
  )
}
