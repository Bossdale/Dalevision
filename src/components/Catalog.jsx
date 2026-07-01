import { useEffect, useRef, useState } from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import ContentCard from './ContentCard'
import { RowSkeleton } from './Skeleton'

/**
 * Paginated, genre-filterable grid used by both Movies and Series pages.
 * - genresFn: () => [{id,name}]
 * - pageFn: (page, genreId) => TMDB page object ({ results, total_pages })
 */
export default function Catalog({ type, title, genresFn, pageFn }) {
  const [genreId, setGenreId] = useState(null)
  const sentinel = useRef(null)

  const genres = useQuery({
    queryKey: [`${type}-genres`],
    queryFn: () => genresFn(),
    staleTime: 1000 * 60 * 60,
  })

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [`${type}-catalog`, genreId],
    queryFn: ({ pageParam = 1 }) => pageFn(pageParam, genreId),
    initialPageParam: 1,
    getNextPageParam: (last, pages) =>
      last && pages.length < (last.total_pages ?? 1) ? pages.length + 1 : undefined,
  })

  // Infinite scroll via IntersectionObserver.
  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: '400px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const items = data?.pages.flatMap((p) => p?.results ?? []) ?? []

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-4xl tracking-wide">{title}</h1>
        <select
          value={genreId ?? ''}
          onChange={(e) => setGenreId(e.target.value ? Number(e.target.value) : null)}
          className="select-glass ml-auto text-sm"
        >
          <option value="">All genres</option>
          {genres.data?.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <RowSkeleton count={10} />}
      {isError && <p className="text-sm text-gray-500">Couldn’t load titles.</p>}

      {!isLoading && !isError && items.length === 0 && (
        <p className="text-sm text-gray-500">No titles found.</p>
      )}

      <div className="grid grid-cols-3 justify-items-center gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
        {items.map((item) => (
          <ContentCard key={`${item.id}`} item={{ ...item, media_type: type }} />
        ))}
      </div>

      <div ref={sentinel} className="h-10" />
      {isFetchingNextPage && (
        <p className="py-4 text-center text-sm text-gray-500">Loading more…</p>
      )}
    </div>
  )
}
