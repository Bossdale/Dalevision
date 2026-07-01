# Dalevision

A Netflix-style movie & series web app. Access is gated by **admin approval** (no subscriptions). Built with React (Vite) + TailwindCSS + Firebase (Auth/Firestore) + TMDB, with sandboxed embeds for playback/downloads.

## Stack
- **Frontend:** React 18 + Vite + TailwindCSS
- **Data fetching:** TanStack Query (caching/retry/dedup)
- **Auth & DB:** Firebase Authentication + Cloud Firestore
- **Metadata:** TMDB API
- **Playback/Download:** sandboxed `<iframe>` embeds (vidsrc.me / embed.su / dl.vidsrc.me)

## Setup

1. **Install deps**
   ```bash
   npm install
   ```

2. **Environment** — copy `.env.example` to `.env` and fill in:
   - Firebase web config (Project settings → General → Your apps → SDK config)
   - TMDB v3 API key (https://www.themoviedb.org/settings/api)

   > All `VITE_*` vars are bundled into the client and are public by design. Don't put real secrets here.

3. **Firebase project**
   - Enable **Email/Password** auth
   - Create **Firestore** (production mode)
   - Enable **Hosting** (optional, for deploy)

4. **Deploy security rules & hosting config**
   ```bash
   npm run build
   firebase deploy --only firestore:rules,hosting
   ```
   - `firestore.rules` — field-locked: users can't change their own `role`/`status` (prevents self-approval / self-admin). Admins manage all users.
   - `firebase.json` — SPA rewrite (`**` → `/index.html`) + global CSP headers (incl. `frame-src` allowlist for the embeds).

5. **Seed the first admin** (manual, one-time)
   - Register a normal account in the app.
   - In Firebase Console → Firestore → `users/{that-uid}` → set `role: "admin"` and `status: "approved"`.
   - That user can now open `/admin` and approve everyone else.

## Run
```bash
npm run dev       # http://localhost:5173
npm run build     # production build → dist/
npm run preview   # preview the build
```

## How access works
- New users → Firestore doc `{ role: "user", status: "pending" }`.
- Pending users see `/pending` (updates live via `onSnapshot` the instant an admin approves — no re-login).
- Approved users get the full app. Banned users see `/banned`.
- `/admin` (admins only) approves / bans / deletes users.

## Security notes
- **Access control lives in Firestore rules**, not the client guards (which are UX only). See `firestore.rules`.
- **Embeds** use `sandbox="allow-scripts allow-same-origin"` with pop-up / top-navigation / modal tokens deliberately omitted — this blocks pop-ups and redirects from third-party embeds. CSP `frame-src` (Hosting headers) separately restricts which domains can be framed.
- **Deleting another user's Auth account** requires a Cloud Function (Admin SDK); the panel bans by default and deletes only the Firestore doc.
- **Embed sources** are configured in `src/lib/sources.js` — swap domains there if one goes down; the player has a "switch source" button and a load-failure fallback.
