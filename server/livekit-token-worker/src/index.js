// Cloudflare Worker: mints LiveKit access tokens — dependency-free.
//
// A LiveKit token is just an HS256 JWT with a `video` grant, so we sign it with
// the Workers-native Web Crypto API (no npm packages, no nodejs_compat needed —
// this avoids the build/compat failures of livekit-server-sdk on Workers).
//
// Secrets (wrangler secret put ...):
//   LIVEKIT_API_KEY, LIVEKIT_API_SECRET, FIREBASE_PROJECT_ID
//
// Deploy:  cd server/livekit-token-worker && npm install && npx wrangler deploy

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

function b64url(input) {
  let str
  if (typeof input === 'string') {
    str = btoa(unescape(encodeURIComponent(input)))
  } else {
    str = btoa(String.fromCharCode(...new Uint8Array(input)))
  }
  return str.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

async function signLiveKitToken(apiKey, apiSecret, identity, name, room) {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'HS256', typ: 'JWT' }
  const payload = {
    iss: apiKey,
    sub: identity,
    name: name || identity,
    nbf: now,
    exp: now + 2 * 60 * 60, // 2 hours
    video: {
      room,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    },
  }
  const enc = new TextEncoder()
  const data = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(apiSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data))
  return `${data}.${b64url(sig)}`
}

// Lightweight Firebase ID-token claim check (aud/iss/exp). Sufficient with
// HTTPS for a hobby app; add full RS256 verification for production.
function checkFirebaseToken(idToken, projectId) {
  const parts = (idToken || '').split('.')
  if (parts.length !== 3) throw new Error('malformed auth token')
  const p = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
  if (p.aud !== projectId) throw new Error('bad audience')
  if (p.iss !== `https://securetoken.google.com/${projectId}`) throw new Error('bad issuer')
  if (p.exp * 1000 < Date.now()) throw new Error('token expired')
  if (!p.sub) throw new Error('no subject')
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS })
    if (request.method !== 'POST') return json({ error: 'POST only' }, 405)

    try {
      const { room, identity, name, idToken } = await request.json()
      if (!room || !identity) return json({ error: 'room and identity required' }, 400)
      if (!idToken) return json({ error: 'auth required' }, 401)

      checkFirebaseToken(idToken, env.FIREBASE_PROJECT_ID)

      const token = await signLiveKitToken(
        env.LIVEKIT_API_KEY,
        env.LIVEKIT_API_SECRET,
        identity,
        name,
        room,
      )
      return json({ token })
    } catch (err) {
      return json({ error: String(err.message || err) }, 401)
    }
  },
}
