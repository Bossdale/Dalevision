import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import SandboxedFrame from '../components/SandboxedFrame'
import { VIDEO_SOURCES, buildUrl } from '../lib/sources'
import { getDetails, titleOf } from '../lib/tmdb'
import { useAuth } from '../contexts/AuthContext'
import { addToWatchHistory } from '../lib/watchHistory'

export default function Watch() {
  const { type, id, season, episode } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [sourceIdx, setSourceIdx] = useState(0)

  const source = VIDEO_SOURCES[sourceIdx]

  // Fetch light metadata (for title + poster in history, and title-based sources).
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

  // Record watch history once per view.
  useEffect(() => {
    if (!currentUser || !data) return
    addToWatchHistory(currentUser.uid, {
      id,
      type,
      title: titleOf(data),
      posterPath: data.poster_path ?? null,
    }).catch(() => {})
  }, [currentUser, data, id, type])

  const nextSource = () => setSourceIdx((i) => (i + 1) % VIDEO_SOURCES.length)

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between gap-3 bg-black/90 px-4 py-2 text-white">
        <button
          onClick={() => navigate(-1)}
          className="rounded bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
        >
          ‹ Back
        </button>
        <p className="truncate text-sm text-gray-300">
          {data ? titleOf(data) : 'Loading…'}
          {type === 'tv' ? ` — S${season} E${episode}` : ''}
        </p>
        <button
          onClick={nextSource}
          className="rounded bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
          title="Try a different source if this one fails"
        >
          Source: {source.name} ⟳
        </button>
      </div>
      <div className="relative flex-1">
        <SandboxedFrame src={src} title="Video player" />
      </div>
    </div>
  )
}
