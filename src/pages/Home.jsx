import { useQuery } from '@tanstack/react-query'
import HeroCarousel from '../components/HeroCarousel'
import ContentRow from '../components/ContentRow'
import Top10Row from '../components/Top10Row'
import {
  getTrending,
  getPopularMovies,
  getPopularSeries,
  getTopRated,
  getTop10MoviesPH,
  getTop10SeriesPH,
  getFilipinoMovies,
  getFilipinoSeries,
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
  const pinoyMovies = useRow('filipino-movies', getFilipinoMovies)
  const pinoySeries = useRow('filipino-series', getFilipinoSeries)

  // Featured carousel: loop through the top movies (fall back to trending).
  const heroItems =
    (movies.data && movies.data.length ? movies.data : trending.data) ?? []

  return (
    <div className="pb-16">
      <HeroCarousel items={heroItems} />

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
          title="🇵🇭 Filipino Movies"
          items={pinoyMovies.data}
          loading={pinoyMovies.isLoading}
          error={pinoyMovies.isError}
        />
        <ContentRow
          title="🇵🇭 Pinoy Series"
          items={pinoySeries.data}
          loading={pinoySeries.isLoading}
          error={pinoySeries.isError}
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
