import { useState } from 'react'
import { ParticipantTile, TrackToggle } from '@livekit/components-react'
import { Track } from 'livekit-client'
import '@livekit/components-styles'
import { useLive } from './LiveProvider'
import Avatar from './Avatar'

// Participant tiles + controls (mic/cam toggle, screen share, call volume,
// float). Reads everything from the shared LiveProvider context.
export default function VideoChat({ avatars }) {
  const live = useLive()
  const [floating, setFloating] = useState(false)

  if (!live.configured) {
    return (
      <div className="glass-card p-3 text-xs text-gray-400">
        📷 Camera/mic &amp; screen share are off. Configure LiveKit to enable them (see{' '}
        <span className="text-gray-300">server/livekit-token-worker</span>).
      </div>
    )
  }

  const tracks = live.camTracks || []
  const btn = 'rounded bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20'
  // While YOU are sharing, keep tiles docked (below the movie) so they stay
  // outside the shared-movie crop and aren't visible to viewers.
  const effFloating = floating && !live.isLocalSharing

  return (
    <div
      className={effFloating ? 'fixed inset-x-0 bottom-3 z-[60] mx-auto w-full max-w-4xl px-3' : ''}
      data-lk-theme="default"
    >
      <div className="glass-card p-2">
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

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <TrackToggle source={Track.Source.Microphone} className={btn}>
            Mic
          </TrackToggle>
          <TrackToggle source={Track.Source.Camera} className={btn}>
            Cam
          </TrackToggle>
          <button
            onClick={live.toggleShare}
            className={`${btn} ${live.isLocalSharing ? '!bg-accent font-semibold' : ''}`}
            title="Share your movie tab so everyone watches your screen in sync"
          >
            {live.isLocalSharing ? '■ Stop sharing' : '🖥 Share movie'}
          </button>
          <label className="flex items-center gap-1.5 text-xs text-gray-300">
            🔊 Call
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={live.callVolume}
              onChange={(e) => live.setCallVolume(Number(e.target.value))}
              className="accent-accent"
            />
          </label>
          {!live.isLocalSharing && (
            <button onClick={() => setFloating((f) => !f)} className={`${btn} ml-auto`}>
              {floating ? 'Dock ▾' : 'Float ▴'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
