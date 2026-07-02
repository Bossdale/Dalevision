// Franchises whose characters are offered as profile avatars.
// Each pulls its cast from TMDB by id (add/remove/reorder freely).
// type: 'tv' | 'movie'; id: TMDB id.
export const AVATAR_CATEGORIES = [
  { key: 'hotd', label: 'House of the Dragon', type: 'tv', id: 94997 },
  { key: 'youngsheldon', label: 'Young Sheldon', type: 'tv', id: 71728 },
  { key: 'prisonbreak', label: 'Prison Break', type: 'tv', id: 2288 },
  { key: 'avengers', label: 'Avengers', type: 'movie', id: 299534 }, // Endgame (big cast)
  { key: 'moneyheist', label: 'Money Heist', type: 'tv', id: 71446 },
  { key: 'bridgerton', label: 'Bridgerton', type: 'tv', id: 63247 },
  { key: 'strangerthings', label: 'Stranger Things', type: 'tv', id: 66732 },
]
