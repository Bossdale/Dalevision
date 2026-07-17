import { doc, runTransaction, updateDoc } from 'firebase/firestore'
import { db } from './firebase'

const MAX_HISTORY = 20

/**
 * Append an item to the user's watch history.
 * Uses a transaction (NOT arrayUnion) so we get: most-recent-first, deduped by
 * id+type, and capped at 20 — atomically, without clobbering concurrent tabs.
 */
export async function addToWatchHistory(uid, item) {
  if (!uid || !item?.id) return
  const ref = doc(db, 'users', uid)
  const entry = {
    id: String(item.id),
    type: item.type === 'tv' ? 'tv' : 'movie',
    title: item.title || 'Untitled',
    posterPath: item.posterPath || null,
    watchedAt: Date.now(),
  }

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists()) return
    const current = snap.data().watchHistory || []
    const deduped = current.filter(
      (h) => !(String(h.id) === entry.id && h.type === entry.type),
    )
    const next = [entry, ...deduped].slice(0, MAX_HISTORY)
    tx.update(ref, { watchHistory: next })
  })
}

export async function removeFromWatchHistory(uid, id, type) {
  if (!uid || !id) return
  const ref = doc(db, 'users', uid)
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists()) return
    const current = snap.data().watchHistory || []
    const next = current.filter(
      (h) => !(String(h.id) === String(id) && h.type === type),
    )
    tx.update(ref, { watchHistory: next })
  })
}

// Remembers the NEXT season/episode to watch for a series (advanced after the
// user finishes an episode). Read on the Detail page to preselect it.
export async function setSeriesProgress(uid, seriesId, { season, episode }) {
  if (!uid || !seriesId || !season) return
  await updateDoc(doc(db, 'users', uid), {
    [`seriesProgress.${seriesId}`]: { season, episode: episode || 1, at: Date.now() },
  }).catch(() => {})
}

export async function clearWatchHistory(uid) {
  if (!uid) return
  const ref = doc(db, 'users', uid)
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists()) return
    tx.update(ref, { watchHistory: [] })
  })
}
