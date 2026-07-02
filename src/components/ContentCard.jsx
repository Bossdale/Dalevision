import { Link } from 'react-router-dom'
import { IMG, titleOf, typeOf, yearOf } from '../lib/tmdb'

export default function ContentCard({ item }) {
  if (!item) return null
  const type = typeOf(item)
  const title = titleOf(item)
  const poster = IMG.poster(item.poster_path)
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null

  return (
    <Link
      to={`/detail/${type}/${item.id}`}
      className="group/card relative block w-28 shrink-0 sm:w-36"
      title={title}
    >
      <div className="relative overflow-hidden rounded-xl bg-surface shadow-card ring-1 ring-white/10 transition-all duration-300 group-hover/card:z-10 group-hover/card:scale-105 group-hover/card:ring-accent/60">
        {poster ? (
          <img
            src={poster}
            alt={title}
            loading="lazy"
            className="h-44 w-full object-cover sm:h-52"
          />
        ) : (
          <div className="flex h-44 w-full items-center justify-center px-2 text-center text-xs text-gray-500 sm:h-52">
            {title}
          </div>
        )}
        {rating && (
          <span className="absolute right-1.5 top-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-bold text-yellow-400 backdrop-blur-sm">
            ★ {rating}
          </span>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2 opacity-0 transition-opacity group-hover/card:opacity-100">
          <p className="line-clamp-2 text-xs font-medium text-white">{title}</p>
          <p className="text-[10px] text-gray-400">
            {type === 'tv' ? 'Series' : 'Movie'}
            {yearOf(item) ? ` · ${yearOf(item)}` : ''}
          </p>
        </div>
      </div>
    </Link>
  )
}
