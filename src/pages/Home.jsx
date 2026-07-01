import { useQuery } from '@tanstack/react-query'
import Hero from '../components/Hero'
import ContentRow from '../components/ContentRow'
import Top10Row from '../components/Top10Row'
import {
  getTrending,
  getPopularMovies,
  getPopularSeries,
  getTopRated,
  getTop10MoviesPH,
  getTop10SeriesPH,
} from '../lib/tmdb'

function useRow(key, fn) {
  return useQuery({ queryKey: [key], queryFn: () => fn() })
}

export default function Home() {
  const trending = useRow('trending', getTrending)
  const movies = useRow('popular-movies', getPopularMovies)
  const series = useRow('popular-series', getPopularSeries)
  const topRated = useRow('top-rated', getTopRated)
  const top10Movies = useRow('top10-movies-ph', getTop10MoviesPH)
  const top10Series = useRow('top10-series-ph', getTop10SeriesPH)

  const hero = trending.data?.find((t) => t.backdrop_path) ?? trending.data?.[0]

  return (
    <div className="pb-16">
      <Hero item={hero} />

      <div className="relative z-10 -mt-10 animate-fade-in-up">
        <ContentRow
          title="Trending Now"
          items={trending.data}
          loading={trending.isLoading}
          error={trending.isError}
        />

        {/* Netflix-style Top 10 — Philippines */}
        <Top10Row
          title="Top 10 Movies in the Philippines Today"
          items={top10Movies.data}
          loading={top10Movies.isLoading}
          error={top10Movies.isError}
        />
        <Top10Row
          title="Top 10 Series in the Philippines Today"
          items={top10Series.data}
          loading={top10Series.isLoading}
          error={top10Series.isError}
        />

        <ContentRow
          title="Popular Movies"
          items={movies.data}
          loading={movies.isLoading}
          error={movies.isError}
        />
        <ContentRow
          title="Popular Series"
          items={series.data}
          loading={series.isLoading}
          error={series.isError}
        />
        <ContentRow
          title="Top Rated"
          items={topRated.data}
          loading={topRated.isLoading}
          error={topRated.isError}
        />
      </div>
    </div>
  )
}
