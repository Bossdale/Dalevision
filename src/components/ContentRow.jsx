import { useRef } from 'react'
import ContentCard from './ContentCard'
import { RowSkeleton } from './Skeleton'

export default function ContentRow({ title, items, loading, error }) {
  const scroller = useRef(null)

  const scrollBy = (dir) => {
    scroller.current?.scrollBy({ left: dir * 400, behavior: 'smooth' })
  }

  return (
    <section className="my-7">
      {title && <h2 className="section-title mb-3">{title}</h2>}

      {loading && <RowSkeleton />}

      {error && (
        <p className="px-4 text-sm text-gray-500">Couldn’t load this row.</p>
      )}

      {!loading && !error && (!items || items.length === 0) && (
        <p className="px-4 text-sm text-gray-500">Nothing here yet.</p>
      )}

      {!loading && !error && items && items.length > 0 && (
        <div className="group/row relative">
          <button
            onClick={() => scrollBy(-1)}
            aria-label="Scroll left"
            className="absolute left-0 top-0 z-20 hidden h-full w-12 items-center justify-center bg-gradient-to-r from-black/60 to-transparent text-2xl text-white opacity-0 transition-opacity hover:from-black/80 group-hover/row:opacity-100 md:flex"
          >
            ‹
          </button>
          <div
            ref={scroller}
            className="no-scrollbar flex gap-3 overflow-x-auto scroll-smooth px-4 pb-2"
          >
            {items.map((item) => (
              <ContentCard key={`${item.id}-${item.media_type ?? ''}`} item={item} />
            ))}
          </div>
          <button
            onClick={() => scrollBy(1)}
            aria-label="Scroll right"
            className="absolute right-0 top-0 z-20 hidden h-full w-12 items-center justify-center bg-gradient-to-l from-black/60 to-transparent text-2xl text-white opacity-0 transition-opacity hover:from-black/80 group-hover/row:opacity-100 md:flex"
          >
            ›
          </button>
        </div>
      )}
    </section>
  )
}
