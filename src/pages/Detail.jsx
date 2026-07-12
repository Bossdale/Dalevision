import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { IMG, getDetails, pickTrailerKey, titleOf, yearOf } from '../lib/tmdb'
import { newRoomId } from '../lib/rooms'
import Spinner from '../components/Spinner'

// Format TMDB runtime (minutes) as "2h 14m" / "45m".
function formatRuntime(min) {
  if (!min || min <= 0) return null
  const h = Math.floor(min / 60)
  const m = min % 60
  return h ? `${h}h ${m}m` : `${m}m`
}

export default function Detail() {
  const { type, id } = useParams()
  const navigate = useNavigate()
  const isTv = type === 'tv'
  const [showTrailer, setShowTrailer] = useState(false)
  const [season, setSeason] = useState(1)
  const [episode, setEpisode] = useState(1)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['details', type, id],
    queryFn: () => getDetails(type, id),
  })

  const trailerKey = useMemo(
    () => (data?.videos?.results ? pickTrailerKey(data.videos.results) : null),
    [data],
  )

  // Real (non-"season 0"/specials) seasons for the picker.
  const seasons = useMemo(
    () => (data?.seasons ?? []).filter((s) => s.season_number > 0 && s.episode_count > 0),
    [data],
  )
  const currentSeason = seasons.find((s) => s.season_number === season)
  const episodeCount = currentSeason?.episode_count ?? 1

  if (isLoading) return <Spinner full />
  if (isError || !data)
    return <p className="p-8 text-gray-400">Couldn’t load this title.</p>

  const title = titleOf(data)
  const backdrop = IMG.backdrop(data.backdrop_path)
  const cast = (data.credits?.cast ?? []).slice(0, 10)

  const goWatch = () => {
    if (isTv) navigate(`/watch/tv/${id}/${season}/${episode}`)
    else navigate(`/watch/movie/${id}`)
  }
  const goDownload = () => {
    if (isTv) navigate(`/download/tv/${id}?season=${season}&episode=${episode}`)
    else navigate(`/download/movie/${id}`)
  }

  return (
    <div className="pb-16">
      {/* Backdrop header */}
      <div className="relative h-[46vh] min-h-[300px] w-full">
        {backdrop && (
          <img src={backdrop} alt={title} className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-base via-base/50 to-transparent" />
        <button
          onClick={() => navigate('/')}
          className="glass absolute left-4 top-4 rounded-full px-4 py-1.5 text-sm text-white transition hover:bg-white/20"
        >
          ‹ Back
        </button>
      </div>

      {/* relative z-10 lifts this block ABOVE the positioned backdrop so the
          poster and details are not painted behind the background image. */}
      <div className="relative z-10 mx-auto -mt-24 max-w-5xl px-4">
        <div className="flex flex-col gap-6 md:flex-row">
          {IMG.poster(data.poster_path) && (
            <img
              src={IMG.poster(data.poster_path)}
              alt={title}
              className="w-36 shrink-0 self-center rounded-xl shadow-card ring-1 ring-white/10 sm:w-40 md:self-start"
            />
          )}
          <div className="flex-1">
            <h1 className="font-display text-4xl leading-none tracking-wide text-shadow md:text-5xl">
              {title}
            </h1>

            {/* Year premiered · duration · rating */}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-300">
              {yearOf(data) && <span className="chip">{yearOf(data)}</span>}
              {isTv
                ? data.number_of_seasons && (
                    <span className="chip">
                      {data.number_of_seasons} season{data.number_of_seasons > 1 ? 's' : ''}
                    </span>
                  )
                : data.runtime > 0 && <span className="chip">{formatRuntime(data.runtime)}</span>}
              {data.vote_average > 0 && (
                <span className="chip text-yellow-400">★ {data.vote_average.toFixed(1)}</span>
              )}
            </div>

            {/* Genres */}
            {(data.genres ?? []).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {data.genres.map((g) => (
                  <span key={g.id} className="chip">
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="mt-5 max-w-2xl">
              <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-300">
                About
              </h2>
              <p
                className="text-sm leading-relaxed md:text-base"
                style={{ color: '#ffffff' }}
              >
                {data.overview || 'No description available for this title.'}
              </p>
            </div>

            {/* TV season/episode picker */}
            {isTv && seasons.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-4">
                <label className="text-sm">
                  <span className="mb-1 block text-gray-400">Season</span>
                  <select
                    value={season}
                    onChange={(e) => {
                      setSeason(Number(e.target.value))
                      setEpisode(1)
                    }}
                    className="select-glass"
                  >
                    {seasons.map((s) => (
                      <option key={s.id} value={s.season_number}>
                        Season {s.season_number}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-gray-400">Episode</span>
                  <select
                    value={episode}
                    onChange={(e) => setEpisode(Number(e.target.value))}
                    className="select-glass"
                  >
                    {Array.from({ length: episodeCount }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        Episode {n}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={goWatch} className="btn-primary">
                ▶ Watch Now
              </button>
              <button onClick={goDownload} className="btn-secondary">
                ⭳ Download
              </button>
              <button
                onClick={() =>
                  navigate(
                    `/watch-together/${newRoomId()}?et=${type}&eid=${id}` +
                      (isTv ? `&es=${season}&ee=${episode}` : ''),
                  )
                }
                className="btn-secondary"
              >
                👥 Watch Together
              </button>
              {trailerKey && (
                <button onClick={() => setShowTrailer(true)} className="btn-secondary">
                  Trailer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Cast */}
        {cast.length > 0 && (
          <section className="mt-10">
            <h2 className="section-title mb-4">Cast</h2>
            <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {cast.map((c) => (
                <div key={c.id} className="w-20 shrink-0 text-center">
                  {IMG.profile(c.profile_path) ? (
                    <img
                      src={IMG.profile(c.profile_path)}
                      alt={c.name}
                      className="mb-1 h-24 w-20 rounded object-cover"
                    />
                  ) : (
                    <div className="mb-1 flex h-24 w-20 items-center justify-center rounded bg-surface text-2xl text-gray-600">
                      ?
                    </div>
                  )}
                  <p className="text-xs text-gray-200 line-clamp-2">{c.name}</p>
                  <p className="text-[10px] text-gray-500 line-clamp-1">{c.character}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Trailer modal (YouTube — allowed by CSP frame-src) */}
      {showTrailer && trailerKey && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-2 bg-black/90 p-4"
          onClick={() => setShowTrailer(false)}
        >
          <div className="w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
              <iframe
                className="h-full w-full"
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`}
                title="Trailer"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <a
                href={`https://www.youtube.com/watch?v=${trailerKey}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white"
              >
                ▶ Watch on YouTube ↗ (if it doesn’t play here)
              </a>
              <button onClick={() => setShowTrailer(false)} className="text-gray-400 hover:text-white">
                Close ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
