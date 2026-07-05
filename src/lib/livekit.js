import { auth } from './firebase'

const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL
const TOKEN_ENDPOINT = import.meta.env.VITE_LIVEKIT_TOKEN_ENDPOINT

// Watch Together's camera/mic is optional — it only turns on when both the
// LiveKit server URL and the token endpoint are configured.
export const isLiveKitConfigured = () => Boolean(LIVEKIT_URL && TOKEN_ENDPOINT)

export const liveKitUrl = () => LIVEKIT_URL

/**
 * Ask the token Worker for a LiveKit access token for this room/user.
 * Sends the Firebase ID token so the Worker can verify who's asking.
 */
export async function fetchLiveKitToken(roomId, identity, name) {
  if (!isLiveKitConfigured()) return null
  const idToken = await auth.currentUser?.getIdToken()
  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ room: roomId, identity, name, idToken }),
  })
  if (!res.ok) throw new Error(`Token endpoint error: ${res.status}`)
  const data = await res.json()
  return data.token
}
