// Config-driven embed sources so dead domains can be swapped without touching
// page code. Order = preference. Each builds an embed URL from the TMDB id.
//
// NOTE: only TMDB-id embed players work inside the sandboxed iframe. Full
// browse/download sites (fzmovies, vegamovies, etc.) are ad-gated and/or send
// anti-framing headers, so they can't play in-frame — they were removed.
export const VIDEO_SOURCES = [
  {
    id: 'vidsrc',
    name: 'VidSrc',
    movie: (id) => `https://vidsrc.me/embed/movie/${id}`,
    tv: (id, s, e) => `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}`,
  },
  {
    id: 'vidlink',
    name: 'VidLink',
    movie: (id) => `https://vidlink.pro/movie/${id}`,
    tv: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}`,
  },
  {
    id: '2embed',
    name: '2Embed',
    movie: (id) => `https://www.2embed.cc/embed/${id}`,
    tv: (id, s, e) => `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`,
  },
  {
    id: 'vidsrccc',
    name: 'VidSrc.cc',
    movie: (id) => `https://vidsrc.cc/v2/embed/movie/${id}`,
    tv: (id, s, e) => `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: 'moviesapi',
    name: 'MoviesAPI',
    // Migrated from moviesapi.club (now dead / 403) to moviesapi.to.
    movie: (id) => `https://moviesapi.to/movie/${id}`,
    tv: (id, s, e) => `https://moviesapi.to/tv/${id}-${s}-${e}`,
  },
]

// Download options. Dedicated "download" domains are unreliable, so these are
// mostly players that include their own Download button — open them via the
// Download page's "Open in new tab" (iframing these usually fails).
export const DOWNLOAD_SOURCES = [
  {
    id: 'vidfast',
    name: 'VidFast',
    movie: (id) => `https://vidfast.pro/movie/${id}`,
    tv: (id, s, e) => `https://vidfast.pro/tv/${id}/${s}/${e}`,
  },
  {
    id: 'vidsrccc',
    name: 'VidSrc.cc',
    movie: (id) => `https://vidsrc.cc/v2/embed/movie/${id}`,
    tv: (id, s, e) => `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: 'dlvidsrc',
    name: 'VidSrc DL',
    movie: (id) => `https://dl.vidsrc.me/movie/${id}`,
    tv: (id, s, e) => `https://dl.vidsrc.me/tv/${id}/${s}/${e}`,
  },
]

export function buildUrl(source, { type, id, season = 1, episode = 1, title = '' }) {
  if (!source) return null
  if (source.titleBased) return title ? source.search(title) : null
  return type === 'tv' ? source.tv(id, season, episode) : source.movie(id)
}
