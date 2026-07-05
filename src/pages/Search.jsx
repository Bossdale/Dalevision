import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import ContentCard from '../components/ContentCard'
import { RowSkeleton } from '../components/Skeleton'
import useDebounce from '../hooks/useDebounce'
import { searchMulti } from '../lib/tmdb'
import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
  removeRecentSearch,
} from '../lib/recentSearches'

export default function Search() {
  const [query, setQuery] = useState('')
  const [recents, setRecents] = useState(getRecentSearches())
  const debounced = useDebounce(query.trim(), 300)

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['search', debounced],
    queryFn: () => searchMulti(debounced),
    enabled: debounced.length >= 2,
  })

  const results = data ?? []

  // Auto-save typed searches (prefix-collapsing keeps the list to final terms).
  useEffect(() => {
    if (debounced.length >= 2) setRecents(addRecentSearch(debounced))
  }, [debounced])

  const onSubmit = (e) => {
    e.preventDefault()
    if (query.trim().length >= 2) setRecents(addRecentSearch(query))
  }

  const runRecent = (term) => {
    setQuery(term)
    setRecents(addRecentSearch(term)) // bump to top
  }
  const delRecent = (term) => setRecents(removeRecentSearch(term))
  const clearAll = () => setRecents(clearRecentSearches())

  const showResults = debounced.length >= 2

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-4 font-display text-4xl tracking-wide">Search</h1>

      <form onSubmit={onSubmit}>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search movies and series…"
          className="input mb-6 max-w-xl"
        />
      </form>

      {/* Recent searches (shown until an active search is running) */}
      {!showResults && recents.length > 0 && (
        <div className="glass-card mb-6 max-w-xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-300">Recent searches</p>
            <button onClick={clearAll} className="text-xs text-gray-400 hover:text-white">
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recents.map((term) => (
              <span
                key={term}
                className="flex items-center gap-1 rounded-full border border-white/10 bg-white/10 py-1 pl-3 pr-1 text-sm text-gray-200"
              >
                <button onClick={() => runRecent(term)} className="hover:text-white">
                  {term}
                </button>
                <button
                  onClick={() => delRecent(term)}
                  aria-label={`Remove ${term}`}
                  className="flex h-5 w-5 items-center justify-center rounded-full text-gray-400 transition hover:bg-accent hover:text-white"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {!showResults && recents.length === 0 && (
        <p className="text-sm text-gray-500">Type at least 2 characters to search.</p>
      )}

      {showResults && (isLoading || isFetching) && <RowSkeleton count={10} />}
      {isError && <p className="text-sm text-gray-500">Search failed. Try again.</p>}

      {showResults && !isLoading && !isFetching && results.length === 0 && (
        <p className="text-sm text-gray-500">No results for “{debounced}”.</p>
      )}

      <div className="grid grid-cols-3 justify-items-center gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
        {showResults &&
          results.map((item) => (
            <ContentCard key={`${item.id}-${item.media_type}`} item={item} />
          ))}
      </div>
    </div>
  )
}
