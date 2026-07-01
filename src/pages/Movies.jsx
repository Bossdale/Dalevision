import Catalog from '../components/Catalog'
import { getMovieGenres, getMoviesPage } from '../lib/tmdb'

export default function Movies() {
  return (
    <Catalog
      type="movie"
      title="Movies"
      genresFn={getMovieGenres}
      pageFn={getMoviesPage}
    />
  )
}
