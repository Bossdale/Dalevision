import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import SandboxedFrame from '../components/SandboxedFrame'
import { VIDEO_SOURCES, buildUrl } from '../lib/sources'
import { getDetails, titleOf } from '../lib/tmdb'
import { useAuth } from '../contexts/AuthContext'
import { addToWatchHistory } from '../lib/watchHistory'

const AUTO_TIMEOUT_MS = 7000 // per-server probe window while auto-selecting

export default function Watch() {
  const { type, id, season, episode } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useAuth()

  const [sourceIdx, setSourceIdx] = useState(0)
  // Auto mode = keep advancing to the next server until one loads.
  const [autoMode, setAutoMode] = useState(true)
  // Collapsible server list: false = single button, true = full list.
  const [serversOpen, setServersOpen] = useState(false)

  // Reset probing whenever the target changes.
  useEffect(() => {
    setSourceIdx(0)
    setAutoMode(true)
  }, [type, id, season, episode])

  const source = VIDEO_SOURCES[sourceIdx]

  const { data } = useQuery({
    queryKey: ['details', type, id],
    queryFn: () => getDetails(type, id),
  })

  const src = buildUrl(source, {
    type,
    id,
    season: Number(season) || 1,
    episode: Number(episode) || 1,
    title: data ? titleOf(data) : '',
  })

  useEffect(() => {
    if (!currentUser || !data) return
    addToWatchHistory(currentUser.uid, {
      id,
      type,
      title: titleOf(data),
      posterPath: data.poster_path ?? null,
    }).catch(() => {})
  }, [currentUser, data, id, type])

  // ---- Next-episode logic (TV only) ----
  // We can't detect playback end inside a cross-origin iframe, so this button is
  // always available. It rolls into the next season and hides at series end.
  const curSeason = Number(season) || 1
  const curEp = Number(episode) || 1
  const seasons = (data?.seasons ?? []).filter(
    (s) => s.season_number > 0 && s.episode_count > 0,
  )
  const epCount = seasons.find((s) => s.season_number === curSeason)?.episode_count ?? null
  const hasNextInSeason = epCount != null && curEp < epCount
  const hasNextSeason = seasons.some((s) => s.season_number === curSeason + 1)
  const nextEpisode =
    type !== 'tv'
      ? null
      : hasNextInSeason
        ? { s: curSeason, e: curEp + 1 }
        : hasNextSeason
          ? { s: curSeason + 1, e: 1 }
          : null
  const goNextEpisode = () => {
    if (nextEpisode) navigate(`/watch/tv/${id}/${nextEpisode.s}/${nextEpisode.e}`)
  }

  const isLast = sourceIdx >= VIDEO_SOURCES.length - 1

  // A server that never loads → auto-advance to the next one.
  const handleTimeout = () => {
    if (autoMode && !isLast) setSourceIdx((i) => i + 1)
  }
  // First server that loads → stop auto-advancing and stay here.
  const handleLoaded = () => {
    if (autoMode) setAutoMode(false)
  }
  // Manual pick → honor the user's choice, stop auto mode.
  const selectServer = (i) => {
    setAutoMode(false)
    setSourceIdx(i)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center gap-3 bg-black/90 px-3 py-2 text-white">
        <button
          onClick={() => navigate(`/detail/${type}/${id}`)}
          className="shrink-0 rounded bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
        >
          ‹ Back
        </button>

        <p className="hidden min-w-0 flex-1 truncate text-sm text-gray-300 sm:block">
          {data ? titleOf(data) : 'Loading…'}
          {type === 'tv' ? ` — S${season} E${episode}` : ''}
        </p>

        {/* Next Episode (TV only) — before the server list */}
        {nextEpisode && (
          <button
            onClick={goNextEpisode}
            title={`Play S${nextEpisode.s} E${nextEpisode.e}`}
            className="shrink-0 rounded bg-accent px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-accent-hover"
          >
            Next Episode ›
          </button>
        )}

        {/* Collapsible server selector — names hidden, shown as Server 1..N */}
        {autoMode && (
          <span className="shrink-0 rounded bg-accent/20 px-2 py-1 text-xs text-accent">
            Auto…
          </span>
        )}
        {!serversOpen ? (
          <button
            onClick={() => setServersOpen(true)}
            className="shrink-0 rounded bg-white/10 px-3 py-1.5 text-xs text-gray-200 transition hover:bg-white/20"
          >
            Server {sourceIdx + 1} ▾
          </button>
        ) : (
          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setServersOpen(false)}
              aria-label="Collapse server list"
              className="shrink-0 rounded bg-white/10 px-2.5 py-1.5 text-xs text-gray-200 transition hover:bg-white/20"
            >
              ‹
            </button>
            {VIDEO_SOURCES.map((s, i) => (
              <button
                key={s.id}
                onClick={() => {
                  selectServer(i)
                  setServersOpen(false)
                }}
                className={`shrink-0 rounded px-2.5 py-1.5 text-xs transition ${
                  i === sourceIdx
                    ? 'bg-accent font-semibold text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                Server {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative flex-1">
        <SandboxedFrame
          src={src}
          title="Video player"
          timeoutMs={autoMode ? AUTO_TIMEOUT_MS : 8000}
          onLoaded={handleLoaded}
          onTimeout={handleTimeout}
        />
      </div>
    </div>
  )
}
