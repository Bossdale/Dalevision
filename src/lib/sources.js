// Config-driven embed/download sources so dead domains can be swapped without
// touching page code. Order = preference.
//
// Two source shapes:
//  - id-based:    movie(id) / tv(id,s,e) build a URL from the TMDB id (players).
//  - title-based: search(title) builds a search URL on a browse/download site.
//    (set `titleBased: true`; these need the movie title, not the TMDB id.)
export const VIDEO_SOURCES = [
  {
    id: 'vidsrc',
    name: 'VidSrc',
    movie: (id) => `https://vidsrc.me/embed/movie/${id}`,
    tv: (id, s, e) => `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}`,
  },
  {
    id: 'embedsu',
    name: 'Embed.su',
    movie: (id) => `https://embed.su/embed/movie/${id}`,
    tv: (id, s, e) => `https://embed.su/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: 'fzmovies',
    name: 'FZMovies',
    titleBased: true,
    search: (title) =>
      `https://fzmovies.cms/csearch.php?searchname=${encodeURIComponent(title)}`,
  },
  {
    id: 'vegamovies',
    name: 'VegaMovies',
    titleBased: true,
    search: (title) => `https://vegamovies.pet/?s=${encodeURIComponent(title)}`,
  },
]

export const DOWNLOAD_SOURCES = [
  {
    id: 'dlvidsrc',
    name: 'VidSrc Download',
    movie: (id) => `https://dl.vidsrc.me/movie/${id}`,
    tv: (id, s, e) => `https://dl.vidsrc.me/tv/${id}/${s}/${e}`,
  },
  {
    id: 'fzmovies',
    name: 'FZMovies',
    titleBased: true,
    // Best-guess search path for the .cms clone; adjust here if it differs.
    search: (title) =>
      `https://fzmovies.cms/csearch.php?searchname=${encodeURIComponent(title)}`,
  },
  {
    id: 'vegamovies',
    name: 'VegaMovies',
    titleBased: true,
    // WordPress-style site search.
    search: (title) => `https://vegamovies.pet/?s=${encodeURIComponent(title)}`,
  },
]

export function buildUrl(source, { type, id, season = 1, episode = 1, title = '' }) {
  if (!source) return null
  if (source.titleBased) return title ? source.search(title) : null
  return type === 'tv' ? source.tv(id, season, episode) : source.movie(id)
}
