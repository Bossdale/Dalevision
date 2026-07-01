import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import SandboxedFrame from '../components/SandboxedFrame'
import { DOWNLOAD_SOURCES, buildUrl } from '../lib/sources'
import { getDetails, titleOf } from '../lib/tmdb'

export default function Download() {
  const { type, id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [sourceIdx, setSourceIdx] = useState(0)

  const source = DOWNLOAD_SOURCES[sourceIdx]

  // Title-based sources (FZMovies, VegaMovies) need the movie title.
  const { data } = useQuery({
    queryKey: ['details', type, id],
    queryFn: () => getDetails(type, id),
  })
  const title = data ? titleOf(data) : ''

  const src = buildUrl(source, {
    type,
    id,
    season: Number(params.get('season')) || 1,
    episode: Number(params.get('episode')) || 1,
    title,
  })

  const nextSource = () => setSourceIdx((i) => (i + 1) % DOWNLOAD_SOURCES.length)

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
          Download{title ? ` — ${title}` : ''}
        </p>
        <button
          onClick={nextSource}
          className="rounded bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
          title="Try a different download source"
        >
          Source: {source.name} ⟳
        </button>
      </div>
      <div className="relative flex-1">
        {/* Identical strict sandbox as the player — blocks pop-ups/redirects.
            Note: title-based sites (FZMovies/VegaMovies) may refuse to load in
            an iframe (X-Frame-Options); that's the site blocking framing. */}
        <SandboxedFrame src={src} title="Download" />
      </div>
    </div>
  )
}
