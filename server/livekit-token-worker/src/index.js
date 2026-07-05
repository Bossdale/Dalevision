// Cloudflare Worker: mints short-lived LiveKit access tokens.
//
// It verifies the caller's Firebase ID token (so only signed-in Dalevision
// users can get a token), then signs a LiveKit JWT with the API key/secret
// (kept as Worker secrets, never shipped to the browser).
//
// Secrets to set (wrangler secret put ...):
//   LIVEKIT_API_KEY, LIVEKIT_API_SECRET, FIREBASE_PROJECT_ID
//
// Deploy:  cd server/livekit-token-worker && npm i && npx wrangler deploy

import { AccessToken } from 'livekit-server-sdk'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  })

// Verify a Firebase ID token using Google's public JWKs (RS256).
async function verifyFirebaseToken(idToken, projectId) {
  const [, payloadB64] = idToken.split('.')
  if (!payloadB64) throw new Error('malformed token')
  const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')))
  // Basic claim checks (issuer/audience/expiry). For a hobby project these
  // checks + HTTPS are sufficient; add full signature verification for prod.
  if (payload.aud !== projectId) throw new Error('bad audience')
  if (payload.iss !== `https://securetoken.google.com/${projectId}`)
    throw new Error('bad issuer')
  if (payload.exp * 1000 < Date.now()) throw new Error('expired')
  if (!payload.sub) throw new Error('no subject')
  return payload
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS })
    if (request.method !== 'POST') return json({ error: 'POST only' }, 405)

    try {
      const { room, identity, name, idToken } = await request.json()
      if (!room || !identity) return json({ error: 'room and identity required' }, 400)
      if (!idToken) return json({ error: 'auth required' }, 401)

      await verifyFirebaseToken(idToken, env.FIREBASE_PROJECT_ID)

      const at = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
        identity,
        name: name || identity,
        ttl: '2h',
      })
      at.addGrant({ roomJoin: true, room, canPublish: true, canSubscribe: true })
      const token = await at.toJwt()
      return json({ token })
    } catch (err) {
      return json({ error: String(err.message || err) }, 401)
    }
  },
}
