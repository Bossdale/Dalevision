// Per-device recent search terms (localStorage). Deduped, most-recent-first,
// capped at 10.
const KEY = 'dalevision:recentSearches'
const MAX = 10

export function getRecentSearches() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || []
  } catch {
    return []
  }
}

export function addRecentSearch(term) {
  const t = (term || '').trim()
  if (!t) return getRecentSearches()
  const tl = t.toLowerCase()
  // Drop exact dupes AND shorter prefixes of the new term, so live typing
  // ("i" → "ir" → "iron man") collapses into just the final term.
  const cur = getRecentSearches().filter((x) => {
    const xl = x.toLowerCase()
    return xl !== tl && !tl.startsWith(xl)
  })
  const next = [t, ...cur].slice(0, MAX)
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
  return next
}

export function removeRecentSearch(term) {
  const next = getRecentSearches().filter((x) => x !== term)
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
  return next
}

export function clearRecentSearches() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
  return []
}
