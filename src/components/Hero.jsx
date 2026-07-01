import { Link } from 'react-router-dom'
import { IMG, titleOf, typeOf, yearOf } from '../lib/tmdb'

export default function Hero({ item }) {
  if (!item) return <div className="h-[60vh] w-full animate-pulse bg-surface" />
  const type = typeOf(item)
  const backdrop = IMG.backdrop(item.backdrop_path)
  const title = titleOf(item)
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null

  return (
    <div className="relative h-[62vh] min-h-[420px] w-full">
      {backdrop && (
        <img
          src={backdrop}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {/* Layered gradients for depth + readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-ink/40" />

      <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end gap-4 px-4 pb-14 sm:px-6 md:px-8">
        <div className="flex items-center gap-2">
          <span className="chip bg-accent/20 text-accent">
            {type === 'tv' ? 'Series' : 'Movie'}
          </span>
          {rating && <span className="chip text-yellow-400">★ {rating}</span>}
          {yearOf(item) && <span className="chip">{yearOf(item)}</span>}
        </div>

        <h1 className="max-w-3xl font-display text-5xl leading-none text-white text-shadow sm:text-6xl md:text-7xl">
          {title}
        </h1>

        <p className="line-clamp-3 max-w-xl text-sm text-gray-300 text-shadow sm:text-base">
          {item.overview}
        </p>

        <div className="mt-1 flex flex-wrap gap-3">
          <Link to={`/watch/${type}/${item.id}`} className="btn-primary">
            <span className="text-lg leading-none">▶</span> Play
          </Link>
          <Link to={`/detail/${type}/${item.id}`} className="btn-secondary">
            ⓘ More info
          </Link>
        </div>
      </div>
    </div>
  )
}
