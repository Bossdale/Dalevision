import { useQuery } from '@tanstack/react-query'
import Catalog from '../components/Catalog'
import Top10Row from '../components/Top10Row'
import { getMovieGenres, getMoviesPage, getTop10Movies } from '../lib/tmdb'

export default function Movies() {
  const top10 = useQuery({ queryKey: ['top10-movies'], queryFn: getTop10Movies })

  return (
    <div>
      <div className="mx-auto max-w-7xl pt-4">
        <Top10Row
          title="Top 10 Movies Today"
          badge={null}
          items={top10.data}
          loading={top10.isLoading}
          error={top10.isError}
        />
      </div>
      <Catalog
        type="movie"
        title="Movies"
        genresFn={getMovieGenres}
        pageFn={getMoviesPage}
      />
    </div>
  )
}
