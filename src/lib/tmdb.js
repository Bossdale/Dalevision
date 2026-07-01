import axios from 'axios'

const API_KEY = import.meta.env.VITE_TMDB_API_KEY

export const IMG = {
  poster: (path, size = 'w500') =>
    path ? `https://image.tmdb.org/t/p/${size}${path}` : null,
  backdrop: (path, size = 'original') =>
    path ? `https://image.tmdb.org/t/p/${size}${path}` : null,
  profile: (path, size = 'w185') =>
    path ? `https://image.tmdb.org/t/p/${size}${path}` : null,
}

const client = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  params: { api_key: API_KEY, language: 'en-US' },
  timeout: 12000,
})

// Retry once on transient failure.
client.interceptors.response.use(undefined, async (error) => {
  const cfg = error.config
  if (cfg && !cfg.__retried && (!error.response || error.response.status >= 500)) {
    cfg.__retried = true
    return client(cfg)
  }
  return Promise.reject(error)
})

const get = async (path, params = {}) => {
  const { data } = await client.get(path, { params })
  return data
}

// ---- Catalog ----------------------------------------------------------------
export const getTrending = (page = 1) =>
  get('/trending/all/week', { page }).then((d) => d.results ?? [])

export const getPopularMovies = (page = 1) =>
  get('/movie/popular', { page }).then((d) => d.results ?? [])

export const getPopularSeries = (page = 1) =>
  get('/tv/popular', { page }).then((d) => d.results ?? [])

export const getTopRated = (page = 1) =>
  get('/movie/top_rated', { page }).then((d) => d.results ?? [])

// Full page object (results + total_pages) for infinite scroll.
export const getMoviesPage = (page = 1, genreId) =>
  genreId
    ? get('/discover/movie', { page, with_genres: genreId, sort_by: 'popularity.desc' })
    : get('/movie/popular', { page })

export const getSeriesPage = (page = 1, genreId) =>
  genreId
    ? get('/discover/tv', { page, with_genres: genreId, sort_by: 'popularity.desc' })
    : get('/tv/popular', { page })

// ---- Top 10 (Philippines) ---------------------------------------------------
// "Popular in the Philippines" — sorted by popularity, scoped to PH watch region,
// with a fallback to PH-origin content. Returns up to 10 items with posters.
export const getTop10MoviesPH = () =>
  get('/discover/movie', {
    sort_by: 'popularity.desc',
    watch_region: 'PH',
    region: 'PH',
    'vote_count.gte': 50,
  }).then((d) => (d.results ?? []).filter((r) => r.poster_path).slice(0, 10))

export const getTop10SeriesPH = () =>
  get('/discover/tv', {
    sort_by: 'popularity.desc',
    watch_region: 'PH',
    'vote_count.gte': 20,
  }).then((d) => (d.results ?? []).filter((r) => r.poster_path).slice(0, 10))

// ---- Details ----------------------------------------------------------------
export const getMovieDetails = (id) =>
  get(`/movie/${id}`, { append_to_response: 'credits,videos' })

export const getSeriesDetails = (id) =>
  get(`/tv/${id}`, { append_to_response: 'credits,videos' })

export const getDetails = (type, id) =>
  type === 'tv' ? getSeriesDetails(id) : getMovieDetails(id)

export const getMovieVideos = (id) =>
  get(`/movie/${id}/videos`).then((d) => d.results ?? [])

// Best YouTube trailer key from a `videos.results` array.
export const pickTrailerKey = (videos = []) => {
  const yt = videos.filter((v) => v.site === 'YouTube')
  const trailer =
    yt.find((v) => v.type === 'Trailer' && v.official) ||
    yt.find((v) => v.type === 'Trailer') ||
    yt.find((v) => v.type === 'Teaser') ||
    yt[0]
  return trailer?.key ?? null
}

// ---- Genres -----------------------------------------------------------------
export const getMovieGenres = () =>
  get('/genre/movie/list').then((d) => d.genres ?? [])

export const getTvGenres = () =>
  get('/genre/tv/list').then((d) => d.genres ?? [])

export const discoverByGenre = (type, genreId, page = 1) =>
  get(`/discover/${type === 'tv' ? 'tv' : 'movie'}`, {
    with_genres: genreId,
    page,
    sort_by: 'popularity.desc',
  }).then((d) => d.results ?? [])

// ---- Search -----------------------------------------------------------------
export const searchMulti = (query, page = 1) =>
  get('/search/multi', { query, page, include_adult: false }).then((d) =>
    (d.results ?? []).filter((r) => r.media_type === 'movie' || r.media_type === 'tv'),
  )

// ---- Helpers ----------------------------------------------------------------
// Normalise title/date/type across movie & tv shapes.
export const titleOf = (item) => item?.title || item?.name || 'Untitled'
export const yearOf = (item) => {
  const d = item?.release_date || item?.first_air_date
  return d ? d.slice(0, 4) : ''
}
export const typeOf = (item) =>
  item?.media_type || (item?.first_air_date || item?.name ? 'tv' : 'movie')
