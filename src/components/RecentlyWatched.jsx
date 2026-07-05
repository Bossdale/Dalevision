import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { IMG } from '../lib/tmdb'
import { clearWatchHistory, removeFromWatchHistory } from '../lib/watchHistory'

// "Recently Watched" row for the Home view — styled like a normal content row,
// with a per-item delete (×) and a Clear all action. Data is the live
// watchHistory from the user's Firestore doc (updates via onSnapshot).
export default function RecentlyWatched() {
  const { currentUser, userProfile } = useAuth()
  const history = userProfile?.watchHistory ?? []
  const scroller = useRef(null)

  if (!history.length) return null

  const scrollBy = (dir) => scroller.current?.scrollBy({ left: dir * 400, behavior: 'smooth' })
  const del = (h) => removeFromWatchHistory(currentUser.uid, h.id, h.type).catch(() => {})
  const clearAll = () => {
    if (window.confirm('Clear your entire Recently Watched list?')) {
      clearWatchHistory(currentUser.uid).catch(() => {})
    }
  }

  return (
    <section className="my-7">
      <div className="mb-3 flex items-center justify-between pr-4">
        <h2 className="section-title">Recently Watched</h2>
        <button onClick={clearAll} className="text-sm text-gray-400 transition-colors hover:text-white">
          Clear all
        </button>
      </div>

      <div className="group/row relative">
        <button
          onClick={() => scrollBy(-1)}
          aria-label="Scroll left"
          className="absolute left-0 top-0 z-20 hidden h-full w-12 items-center justify-center bg-gradient-to-r from-black/60 to-transparent text-2xl text-white opacity-0 transition-opacity hover:from-black/80 group-hover/row:opacity-100 md:flex"
        >
          ‹
        </button>

        <div ref={scroller} className="no-scrollbar flex gap-3 overflow-x-auto scroll-smooth px-4 pb-2">
          {history.map((h) => {
            const poster = IMG.poster(h.posterPath)
            return (
              <div key={`${h.id}-${h.type}-${h.watchedAt}`} className="group/card relative w-28 shrink-0 sm:w-36">
                <Link to={`/detail/${h.type}/${h.id}`} title={h.title} className="block">
                  <div className="relative overflow-hidden rounded-xl bg-surface shadow-card ring-1 ring-white/10 transition-all duration-300 group-hover/card:scale-105 group-hover/card:ring-accent/60">
                    {poster ? (
                      <img src={poster} alt={h.title} loading="lazy" className="h-44 w-full object-cover sm:h-52" />
                    ) : (
                      <div className="flex h-44 w-full items-center justify-center px-2 text-center text-xs text-gray-500 sm:h-52">
                        {h.title}
                      </div>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-gray-300">{h.title}</p>
                </Link>

                {/* Per-item delete */}
                <button
                  onClick={() => del(h)}
                  aria-label={`Remove ${h.title} from recently watched`}
                  title="Remove"
                  className="absolute right-1.5 top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-sm text-white opacity-0 backdrop-blur-sm transition hover:bg-accent group-hover/card:opacity-100"
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>

        <button
          onClick={() => scrollBy(1)}
          aria-label="Scroll right"
          className="absolute right-0 top-0 z-20 hidden h-full w-12 items-center justify-center bg-gradient-to-l from-black/60 to-transparent text-2xl text-white opacity-0 transition-opacity hover:from-black/80 group-hover/row:opacity-100 md:flex"
        >
          ›
        </button>
      </div>
    </section>
  )
}
