import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import ContentCard from '../components/ContentCard'
import { RowSkeleton } from '../components/Skeleton'
import useDebounce from '../hooks/useDebounce'
import { searchMulti } from '../lib/tmdb'

export default function Search() {
  const [query, setQuery] = useState('')
  const debounced = useDebounce(query.trim(), 300)

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['search', debounced],
    queryFn: () => searchMulti(debounced),
    enabled: debounced.length >= 2,
  })

  const results = data ?? []

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-4 font-display text-4xl tracking-wide">Search</h1>
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search movies and series…"
        className="input mb-6 max-w-xl"
      />

      {debounced.length < 2 && (
        <p className="text-sm text-gray-500">Type at least 2 characters to search.</p>
      )}

      {debounced.length >= 2 && (isLoading || isFetching) && <RowSkeleton count={10} />}

      {isError && <p className="text-sm text-gray-500">Search failed. Try again.</p>}

      {debounced.length >= 2 && !isLoading && !isFetching && results.length === 0 && (
        <p className="text-sm text-gray-500">No results for “{debounced}”.</p>
      )}

      <div className="grid grid-cols-3 justify-items-center gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
        {results.map((item) => (
          <ContentCard key={`${item.id}-${item.media_type}`} item={item} />
        ))}
      </div>
    </div>
  )
}
