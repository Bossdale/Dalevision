# LiveKit Token Worker

Mints LiveKit access tokens for Dalevision's Watch Together camera/mic chat.
Runs as a free Cloudflare Worker so the LiveKit API secret never ships to the
browser. **Optional** — Watch Together works without it (synced player + chat);
only the camera/mic panel needs it.

## One-time setup

1. Create a free LiveKit Cloud project → https://cloud.livekit.io
   - Copy the **wss URL** (e.g. `wss://yourproject.livekit.cloud`) and the
     **API Key** + **API Secret**.

2. Install + log in to Cloudflare Wrangler:
   ```bash
   cd server/livekit-token-worker
   npm install
   npx wrangler login
   ```

3. Set the secrets:
   ```bash
   npx wrangler secret put LIVEKIT_API_KEY
   npx wrangler secret put LIVEKIT_API_SECRET
   npx wrangler secret put FIREBASE_PROJECT_ID   # dalevision-d8a53
   ```

4. Deploy:
   ```bash
   npx wrangler deploy
   ```
   Note the deployed URL, e.g. `https://dalevision-livekit-token.<you>.workers.dev`.

5. In the main app's `.env`:
   ```
   VITE_LIVEKIT_URL=wss://yourproject.livekit.cloud
   VITE_LIVEKIT_TOKEN_ENDPOINT=https://dalevision-livekit-token.<you>.workers.dev
   ```
   Rebuild + redeploy the site. Camera/mic now activates in Watch Together.

## Notes
- CSP: the app already allowlists `https://*.livekit.cloud`, `wss://*.livekit.cloud`,
  and `https://*.workers.dev`. If your Worker/LiveKit uses a custom domain, add it
  to `frame-src`/`connect-src` in `firebase.json`.
- The Worker does lightweight Firebase ID-token claim checks (aud/iss/exp). For
  production, add full RS256 signature verification against Google's JWKs.
