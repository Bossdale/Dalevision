import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { IMG, titleOf, typeOf } from '../lib/tmdb'
import { RowSkeleton } from './Skeleton'

// Netflix-style "Top 10" row: large posters with a big outlined rank number.
export default function Top10Row({ title, items, loading, error, badge = '🇵🇭' }) {
  const scroller = useRef(null)
  const scrollBy = (dir) => scroller.current?.scrollBy({ left: dir * 520, behavior: 'smooth' })

  return (
    <section className="my-8">
      <h2 className="section-title mb-4">
        {badge && <span className="text-base">{badge}</span>}
        {title}
      </h2>

      {loading && <RowSkeleton count={5} />}
      {error && <p className="px-4 text-sm text-gray-500">Couldn’t load this row.</p>}
      {!loading && !error && (!items || items.length === 0) && (
        <p className="px-4 text-sm text-gray-500">Nothing here yet.</p>
      )}

      {!loading && !error && items?.length > 0 && (
        <div className="group relative">
          <button
            onClick={() => scrollBy(-1)}
            aria-label="Scroll left"
            className="absolute left-0 top-0 z-30 hidden h-full w-12 items-center justify-center bg-gradient-to-r from-black/60 to-transparent text-2xl text-white opacity-0 transition-opacity group-hover:opacity-100 md:flex"
          >
            ‹
          </button>

          <div
            ref={scroller}
            className="no-scrollbar flex items-end gap-2 overflow-x-auto px-4 pb-3 pt-2 sm:gap-4"
          >
            {items.map((item, i) => {
              const type = typeOf(item)
              const poster = IMG.poster(item.poster_path, 'w500')
              const rating = item.vote_average ? item.vote_average.toFixed(1) : null
              return (
                <Link
                  key={item.id}
                  to={`/detail/${type}/${item.id}`}
                  title={titleOf(item)}
                  className="group/card relative flex shrink-0 items-end transition-transform duration-300 hover:z-20 hover:scale-[1.04]"
                >
                  {/* Big rank number */}
                  <span
                    className="pointer-events-none select-none font-display leading-[0.7] text-transparent"
                    style={{
                      fontSize: 'clamp(5rem, 16vw, 11rem)',
                      WebkitTextStroke: '2px rgba(255,255,255,0.35)',
                    }}
                  >
                    {i + 1}
                  </span>

                  {/* Poster (larger than standard cards) */}
                  <div className="relative -ml-4 overflow-hidden rounded-xl shadow-card ring-1 ring-white/10 transition group-hover/card:ring-accent/60 sm:-ml-6">
                    {poster ? (
                      <img
                        src={poster}
                        alt={titleOf(item)}
                        loading="lazy"
                        className="h-52 w-36 object-cover sm:h-64 sm:w-44 md:h-72 md:w-48"
                      />
                    ) : (
                      <div className="flex h-52 w-36 items-center justify-center bg-surface p-2 text-center text-xs text-gray-500 sm:h-64 sm:w-44 md:h-72 md:w-48">
                        {titleOf(item)}
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-2 pt-6">
                      <p className="line-clamp-1 text-xs font-semibold text-white sm:text-sm">
                        {titleOf(item)}
                      </p>
                    </div>
                    {rating && (
                      <span className="absolute right-1.5 top-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-yellow-400 backdrop-blur-sm">
                        ★ {rating}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>

          <button
            onClick={() => scrollBy(1)}
            aria-label="Scroll right"
            className="absolute right-0 top-0 z-30 hidden h-full w-12 items-center justify-center bg-gradient-to-l from-black/60 to-transparent text-2xl text-white opacity-0 transition-opacity group-hover:opacity-100 md:flex"
          >
            ›
          </button>
        </div>
      )}
    </section>
  )
}
