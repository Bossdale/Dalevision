import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import SandboxedFrame from './SandboxedFrame'
import { VIDEO_SOURCES, buildUrl } from '../lib/sources'
import { getDetails, titleOf } from '../lib/tmdb'

// Loose-sync co-watching over the third-party embeds. The host controls the
// SELECTION (title / episode / server) — synced to everyone via the room doc —
// but playback isn't frame-synced (embeds are opaque), so the host fires a
// shared "3-2-1" countdown and everyone presses play together.
export default function EmbedTogether({ selection, isHost, cue, bare = false, onSelect, onClear, onCue }) {
  const { type, tmdbId, season = 1, episode = 1, serverIdx = 0 } = selection

  const { data } = useQuery({
    queryKey: ['details', type, tmdbId],
    queryFn: () => getDetails(type, tmdbId),
  })
  const title = data ? titleOf(data) : 'Loading…'

  const source = VIDEO_SOURCES[serverIdx] || VIDEO_SOURCES[0]
  const src = buildUrl(source, {
    type,
    id: tmdbId,
    season: Number(season) || 1,
    episode: Number(episode) || 1,
    title: data ? titleOf(data) : '',
  })

  const seasons = useMemo(
    () => (data?.seasons ?? []).filter((s) => s.season_number > 0 && s.episode_count > 0),
    [data],
  )
  const epCount =
    seasons.find((s) => s.season_number === (Number(season) || 1))?.episode_count ?? 1

  // Countdown overlay. The cue is just a trigger id — each client runs its OWN
  // local 3→2→1 timer, so everyone starts at 3 regardless of clock differences.
  const [remaining, setRemaining] = useState(null)
  useEffect(() => {
    if (!cue?.id) return undefined
    let n = 3
    setRemaining(3)
    const iv = setInterval(() => {
      n -= 1
      setRemaining(n)
      if (n <= 0) clearInterval(iv)
    }, 1000)
    const hide = setTimeout(() => setRemaining(null), 3000 + 1300) // clear "Play!"
    return () => {
      clearInterval(iv)
      clearTimeout(hide)
    }
  }, [cue?.id])

  const update = (patch) => onSelect({ ...selection, ...patch })

  return (
    <div>
      <div className="relative overflow-hidden rounded-xl bg-black" style={{ aspectRatio: '16 / 9' }}>
        <SandboxedFrame src={src} title="Watch together" />
        {remaining !== null && (
          <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-black/70">
            <span className="font-display text-7xl text-white drop-shadow">
              {remaining > 0 ? remaining : '▶ Play!'}
            </span>
          </div>
        )}
      </div>

      {bare ? null : (
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <p className="mr-auto text-sm text-gray-300">
          {title}
          {type === 'tv' ? ` — S${season} E${episode}` : ''}
        </p>
        {isHost && (
          <>
            <button onClick={() => onCue({ id: Date.now() })} className="btn-primary !px-3 !py-1.5 text-sm">
              3‑2‑1 Play
            </button>
            <button onClick={onClear} className="btn-secondary !px-3 !py-1.5 text-sm">
              Change title
            </button>
          </>
        )}
      </div>
      )}

      {bare ? null : isHost ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {type === 'tv' && seasons.length > 0 && (
            <>
              <select
                className="select-glass text-sm"
                value={season}
                onChange={(e) => update({ season: Number(e.target.value), episode: 1 })}
              >
                {seasons.map((s) => (
                  <option key={s.id} value={s.season_number}>
                    Season {s.season_number}
                  </option>
                ))}
              </select>
              <select
                className="select-glass text-sm"
                value={episode}
                onChange={(e) => update({ episode: Number(e.target.value) })}
              >
                {Array.from({ length: epCount }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    Episode {n}
                  </option>
                ))}
              </select>
            </>
          )}
          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
            {VIDEO_SOURCES.map((s, i) => (
              <button
                key={s.id}
                onClick={() => update({ serverIdx: i })}
                className={`shrink-0 rounded px-2.5 py-1.5 text-xs transition ${
                  i === serverIdx
                    ? 'bg-accent font-semibold text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                Server {i + 1}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-2 text-xs text-gray-500">
          The host controls the title, episode, and server. Press play on the video when
          the host counts down.
        </p>
      )}
    </div>
  )
}
