import Catalog from '../components/Catalog'
import { getTvGenres, getSeriesPage } from '../lib/tmdb'

export default function Series() {
  return (
    <Catalog
      type="tv"
      title="Series"
      genresFn={getTvGenres}
      pageFn={getSeriesPage}
    />
  )
}
