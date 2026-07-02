import { useQuery } from '@tanstack/react-query'
import Catalog from '../components/Catalog'
import Top10Row from '../components/Top10Row'
import { getTvGenres, getSeriesPage, getTop10Series } from '../lib/tmdb'

export default function Series() {
  const top10 = useQuery({ queryKey: ['top10-series'], queryFn: getTop10Series })

  return (
    <div>
      <div className="mx-auto max-w-7xl pt-4">
        <Top10Row
          title="Top 10 Series Today"
          badge={null}
          items={top10.data}
          loading={top10.isLoading}
          error={top10.isError}
        />
      </div>
      <Catalog
        type="tv"
        title="Series"
        genresFn={getTvGenres}
        pageFn={getSeriesPage}
      />
    </div>
  )
}
