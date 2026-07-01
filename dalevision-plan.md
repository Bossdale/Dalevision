# Dalevision — Netflix-Style Movie & Series Website Plan

## Top-Level Overview

Build a Netflix-styled movie and series web application called **Dalevision** using:
- **Frontend:** React (Vite) + TailwindCSS
- **Backend/Auth/DB:** Firebase (Authentication + Firestore + Storage)
- **Movie Data:** TMDB API (metadata, posters, genres, trailers)
- **Video Playback:** vidsrc.me / embed.su embedded in a sandboxed `<iframe>` with strict permissions to prevent pop-ups and redirects
- **Downloads:** A sandboxed in-app download page (dl.vidsrc.me or equivalent) embedded in the same iframe sandbox approach as the video player
- **Admin Panel:** A protected route visible only to admin-role users that manages user approval/rejection/ban

### Key Constraints
- No subscription feature — access is gated purely by admin approval
- Newly registered users see a "pending approval" screen until an admin approves them
- Video embeds must be sandboxed (`sandbox="allow-scripts allow-same-origin"`) to block external navigation and pop-ups
- All user data (roles, approval status, profile) lives in Firestore; Firebase Auth handles credentials only

---

## Sub-Task 1 — Project Scaffolding & Firebase Setup

**Status:** `[ ] pending`

### Intent
Bootstrap the Vite + React project with TailwindCSS, configure Firebase project, install all required dependencies, and set up environment variable handling.

### Expected Outcomes
- A running `npm run dev` server showing a blank React app
- Firebase project created with Auth (Email/Password), Firestore, and Hosting enabled
- `.env` file with Firebase config keys wired into the app via `src/lib/firebase.js`
- TailwindCSS working with a dark theme base (Netflix-style dark background)

### Todo List
1. Scaffold project: `npm create vite@latest dalevision -- --template react`
2. Install dependencies: `react-router-dom`, `firebase`, `tailwindcss`, `axios`, `@tanstack/react-query` (TMDB caching — Sub-Task 4)
3. Configure TailwindCSS with a dark-first theme (background `#141414`, accent red `#E50914`)
4. Create Firebase project (console.firebase.google.com) — enable Email/Password Auth, Firestore (production mode), Hosting
5. Create `src/lib/firebase.js` — initialise Firebase app, export `auth`, `db` (Firestore)
6. Create `.env` with `VITE_FIREBASE_*` + `VITE_TMDB_API_KEY` keys and add `.env` to `.gitignore`
7. Create `src/lib/tmdb.js` — Axios instance with `VITE_TMDB_API_KEY` base URL `https://api.themoviedb.org/3`
8. Create `firebase.json` (SPA rewrite `**` → `/index.html` + global CSP headers) and `firestore.rules` — full contents in **Sub-Task 9**. The rewrite is required or deep-link refresh (e.g. `/watch/movie/123`) 404s.

### Relevant Context
- Firebase SDK v9 modular imports (`initializeApp`, `getAuth`, `getFirestore`)
- TMDB free API key obtained at https://www.themoviedb.org/settings/api
- **`VITE_*` vars are bundled into the client and publicly visible.** The TMDB key (read-only) and Firebase config are safe to expose by design — do not put any secret in a `VITE_` var. If the TMDB key must be hidden, proxy TMDB through a Cloud Function.
- TailwindCSS v3 with `darkMode: 'class'` or default dark background

---

## Sub-Task 2 — Authentication (Register, Login, Logout)

**Status:** `[ ] pending`

### Intent
Implement full Firebase Email/Password auth flow with Firestore user document creation on registration. After registration the user's Firestore document is created with `status: "pending"` and `role: "user"`.

### Expected Outcomes
- `/register` page — collects display name, email, password; creates Firebase Auth user + Firestore `/users/{uid}` document
- `/login` page — authenticates with Firebase; on success checks Firestore `status` field
- Auth context (`src/contexts/AuthContext.jsx`) exposes `currentUser`, `userProfile`, `loading`
- Route guard (`PrivateRoute`) redirects unauthenticated users to `/login`
- `PendingRoute` guard redirects approved/pending users appropriately
- Routing after login is driven by `AuthContext` state (`loading` + `userProfile`), **not** by a value read inline right after sign-in (see Todo #3 — race note)

### Todo List
1. Create `src/contexts/AuthContext.jsx` — wraps app, listens to `onAuthStateChanged`, subscribes to the Firestore `/users/{uid}` doc via `onSnapshot` (so `role`/`status`/profile changes propagate live), exposes `currentUser` + `userProfile` + `loading`. Unsubscribe on sign-out.
2. Create `src/pages/Register.jsx` — form with display name, email, password; calls `createUserWithEmailAndPassword`, then writes Firestore doc `{ displayName, email, role: "user", status: "pending", createdAt, avatar: "avatar1" }`. The `role`/`status` defaults are also **enforced server-side** by the `create` rule in Sub-Task 9 — the client value is not trusted.
3. Create `src/pages/Login.jsx` — calls `signInWithEmailAndPassword`. **Do not read `userProfile.status` inline right after sign-in** — at that moment `AuthContext` may not have fetched the Firestore doc yet (it populates asynchronously via `onAuthStateChanged`). Instead, redirect to `/` and let the route guards (`ApprovedRoute`/`PendingRoute`) route based on `loading` + `userProfile` once the profile resolves. Show a spinner while `loading === true`.
4. Create `src/components/PrivateRoute.jsx` — redirects to `/login` if no `currentUser`
5. Create `src/components/ApprovedRoute.jsx` — if `status === "pending"` redirect to `/pending`; if `status === "banned"` redirect to `/banned`
6. Create `src/pages/Pending.jsx` — full-screen "Your account is awaiting admin approval" message with logout button
7. Create `src/pages/Banned.jsx` — full-screen "Your account has been suspended" message

### Relevant Context
- Firestore user document path: `/users/{uid}`
- User document schema: `{ uid, displayName, email, avatar, role, status, createdAt, watchHistory: [] }`
- `status` values: `"pending"` | `"approved"` | `"banned"`
- `role` values: `"user"` | `"admin"`

---

## Sub-Task 3 — Profile Edit Page

**Status:** `[ ] pending`

### Intent
Allow approved users to edit their display name and choose a preset avatar icon from a curated set of Netflix-style avatar images.

### Expected Outcomes
- `/profile` page accessible only to approved users
- User can change display name (updates Firestore doc)
- User can pick from ~12 preset avatar icons (stored as local SVG/PNG assets)
- Changes saved to Firestore `/users/{uid}` and reflected instantly in the navbar

### Todo List
1. Create `src/pages/Profile.jsx` with a form for display name input
2. Add a grid of 12 preset avatar images (`src/assets/avatars/avatar1.png` … `avatar12.png`) — use free illustrated avatars (e.g. DiceBear or hand-picked set)
3. On save: call Firestore `updateDoc` on `/users/{uid}` with **only** `displayName` and `avatar`. Never send `role` or `status` — the `update` rule (Sub-Task 9) rejects any write that changes them, so a save that accidentally includes an unchanged `role`/`status` is fine, but a *changed* one fails.
4. Update `AuthContext` to reflect the change in real time using Firestore **`onSnapshot`** on `/users/{uid}` (preferred over re-fetch). This same live subscription also powers real-time approval — a pending user's screen flips to the app the instant an admin approves, no re-login needed (see Sub-Task 2 / Notes).
5. Display selected avatar and name in the Navbar

### Relevant Context
- Avatar selection is a click-to-select grid, not a file upload
- Display name is synced to Firestore only (not to Firebase Auth `displayName` unless desired)
- `onSnapshot` must be unsubscribed on unmount / logout to avoid leaks and permission errors after sign-out

---

## Sub-Task 4 — TMDB Integration & Movie/Series Data Layer

**Status:** `[ ] pending`

### Intent
Build the data-fetching layer that pulls movies and series from TMDB, including home page categories, search, and detail pages.

### Expected Outcomes
- `src/lib/tmdb.js` exposes helper functions: `getTrending`, `getPopularMovies`, `getPopularSeries`, `getTopRated`, `getMovieDetails`, `getSeriesDetails`, `searchMulti`, `getMovieVideos`, and **`getMovieGenres`, `getTvGenres`, `discoverByGenre`** (needed by the Movies/Series genre pages in Sub-Task 8)
- Home page displays categorised rows (Trending, Popular Movies, Popular Series, Top Rated)
- Each content card shows poster, title, rating badge
- Detail page shows backdrop, synopsis, genres, cast, trailer embed (YouTube via TMDB), and "Watch Now" button
- TMDB calls are cached/deduped/retried (React Query or SWR) so Home/Movies/Series don't refetch on every navigation
- Loading (skeletons), empty, and error states for rows and detail pages

### Todo List
1. Implement TMDB helper functions in `src/lib/tmdb.js` using Axios with `api_key` query param. Include genre helpers (`getMovieGenres`, `getTvGenres`, `discoverByGenre` via `/discover/{movie|tv}?with_genres=`) and paginated variants (accept a `page` arg) for infinite scroll.
2. Wrap fetches in **React Query (or SWR)** for caching, request dedup, and retry — keyed by endpoint+params.
3. Create `src/components/ContentRow.jsx` — horizontal scrollable row with title, accepts an array of TMDB items; renders skeleton placeholders while loading.
4. Create `src/components/ContentCard.jsx` — poster image, title overlay, hover effect (scale + info reveal)
5. Create `src/pages/Home.jsx` — hero banner (random trending item) + multiple `ContentRow` components
6. Create `src/pages/Detail.jsx` — backdrop header, metadata, trailer modal (YouTube embed), "Watch Now" CTA
7. Create `src/pages/Search.jsx` — **debounced** search input (~300ms) triggers `searchMulti`, displays mixed movie+series results; guard against empty query and show an empty state.
8. Add a shared `<Skeleton>` and error/empty components reused across rows and pages.

### Relevant Context
- TMDB image base URL: `https://image.tmdb.org/t/p/w500{poster_path}`
- TMDB backdrop: `https://image.tmdb.org/t/p/original{backdrop_path}`
- For series, use `/tv/{id}` endpoints; for movies, `/movie/{id}`
- Trailer embed: filter `videos.results` for `type === "Trailer"` and `site === "YouTube"` → embed `https://www.youtube.com/embed/{key}`

---

## Sub-Task 5 — Secure Video Player (Sandboxed Embed)

**Status:** `[ ] pending`

### Intent
Implement the video player page that embeds vidsrc.me/embed.su inside a strictly sandboxed `<iframe>` to prevent pop-ups, redirects, and phishing. This is the core security measure for the streaming feature.

### Expected Outcomes
- `/watch/movie/:id` and `/watch/tv/:id/:season/:episode` routes render the player page
- `<iframe>` has `sandbox="allow-scripts allow-same-origin"` — and **deliberately omits** `allow-top-navigation`, `allow-popups`, `allow-popups-to-escape-sandbox`, `allow-modals`, and `allow-forms`. Omitting these is what blocks pop-ups/redirects; this is the actual security control (not the CSP — see note below).
- `frame-src` is restricted to allowed embed domains via the **global CSP Hosting header** in `firebase.json` (Sub-Task 9), **not** a per-route `<meta>` tag — a Vite SPA has one `index.html`, so a meta CSP is parsed once and cannot differ per route.
- Player falls back to embed.su if vidsrc.me fails (handled by a "Try alternate source" button + a visible "source didn't load" fallback state)
- Player page is fullscreen-friendly with a back button

### Todo List
1. Create `src/pages/Watch.jsx` — accepts `type` (movie/tv), `id`, `season`, `episode` from URL params
2. Build the embed URL: `https://vidsrc.me/embed/movie/{tmdb_id}` or `https://vidsrc.me/embed/tv?tmdb={id}&season={s}&episode={e}`
3. Render `<iframe>` with: `sandbox="allow-scripts allow-same-origin"` (no popup/nav/modal/forms tokens), `allowFullScreen`, `referrerPolicy="no-referrer"`
4. ~~Add a per-page CSP `<meta>` tag~~ → **removed**. `frame-src` is set globally via the Hosting header in Sub-Task 9's `firebase.json`. For local `vite dev` (no Hosting headers), optionally add one static `<meta http-equiv="Content-Security-Policy">` in `index.html` covering all embed domains at once — it is global, not per-route.
5. Add "Switch to alternate source" button that swaps the embed URL to the embed.su equivalent
6. Wrap iframe in a loading spinner that hides once the iframe fires `onLoad`; if `onLoad` doesn't fire within ~8s or errors, show a fallback panel ("This source didn't load — try an alternate source") since these embeds may render blank under a strict sandbox

### Relevant Context
- **Security model, stated correctly:** the `sandbox` attribute (with popups/top-navigation/modals omitted) is what prevents redirects and pop-ups from the iframe. CSP `frame-src` only controls *which domains this page may load into an iframe* — it does **not** stop the child from opening pop-ups or navigating. The two are complementary, not the same defense.
- `allow-scripts allow-same-origin` together is safe here because the embeds are **cross-origin** — the child cannot reach into the parent DOM to strip its own sandbox (that footgun only applies when framing *same-origin* content).
- `sandbox` and `frame-ancestors` CSP directives are **ignored** inside a `<meta>` tag — another reason to set CSP via Hosting headers.
- `referrerPolicy="no-referrer"` prevents the embed from knowing the referrer URL
- vidsrc.me TMDB movie embed: `https://vidsrc.me/embed/movie/{id}`
- vidsrc.me TMDB TV embed: `https://vidsrc.me/embed/tv?tmdb={id}&season={s}&episode={e}`
- embed.su: `https://embed.su/embed/movie/{id}` and `https://embed.su/embed/tv/{id}/{season}/{episode}`
- Consider making the source list config-driven (env var or a Firestore `config` doc) so dead domains can be swapped without a redeploy (see Notes → source reliability)

---

## Sub-Task 5b — Sandboxed Download Page

**Status:** `[ ] pending`

### Intent
Add a "Download" button on the Detail page that opens an in-app sandboxed page embedding a free download source (dl.vidsrc.me or similar). The page must apply the same iframe sandbox restrictions as the video player to block pop-ups and redirect phishing.

### Expected Outcomes
- `/download/:type/:id` route renders a full-screen sandboxed iframe pointing to the download source
- "Download" button visible on the Detail page for approved users
- For TV series, the Detail page lets the user pick a season/episode before downloading
- `<iframe>` uses identical sandbox restrictions as the Watch page (`allow-scripts allow-same-origin`, omitting `allow-popups`, `allow-popups-to-escape-sandbox`, `allow-top-navigation`, `allow-modals`, `allow-forms`)
- The download source domain (`dl.vidsrc.me`) is already in the **global CSP Hosting header** `frame-src` allowlist (Sub-Task 9) — no per-route CSP change is possible or needed
- A "Back" button returns the user to the Detail page

### Todo List
1. Create `src/pages/Download.jsx` — accepts `type`, `id`, and optionally `season`/`episode` from URL params
2. Build the download embed URL:
   - Movie: `https://dl.vidsrc.me/movie/{id}`
   - TV episode: `https://dl.vidsrc.me/tv/{id}/{season}/{episode}`
3. Render `<iframe>` with `sandbox="allow-scripts allow-same-origin"` (no popup/nav/modal/forms tokens), `referrerPolicy="no-referrer"`
4. Ensure `dl.vidsrc.me` is present in the global `frame-src` Hosting-header allowlist (Sub-Task 9) — it already is; no per-page CSP mutation
5. On the Detail page, add a "Download" button (alongside "Watch Now") that navigates to `/download/:type/:id`
6. For TV series on the Detail page, the "Download" button opens a season/episode picker modal before navigating to `/download/tv/:id?season=S&episode=E`

### Relevant Context
- dl.vidsrc.me download URL patterns mirror the embed URL patterns
- Sandbox restrictions are identical to `Watch.jsx` — reuse the same iframe wrapper component if already extracted
- The Download page is only accessible to approved users (protected by `ApprovedRoute`)

---

## Sub-Task 6 — Watch History

**Status:** `[ ] pending`

### Intent
Track what the user has watched and display it on their profile page, stored in Firestore.

### Expected Outcomes
- When a user starts watching a movie/episode, the TMDB id + title + type is appended to Firestore `/users/{uid}.watchHistory`
- Profile page shows a "Continue Watching" or "Watch History" row of up to 20 most recent items
- Each item in history is clickable and navigates back to the Detail page

### Todo List
1. On `Watch.jsx` mount, call `addToWatchHistory(uid, { id, type, title, posterPath, watchedAt })`. **Do not use `arrayUnion`** — each entry has a unique `watchedAt`, so `arrayUnion` would never dedupe *and* can't trim to 20 atomically. Instead use a **read-modify-write in a Firestore transaction**: read current `watchHistory`, remove any existing entry with the same `id`+`type`, prepend the new entry, `slice(0, 20)`, then write back. This gives "most-recent-first, deduped, capped" semantics.
2. The `slice(0, 20)` in step 1 handles the cap — no separate trim step needed.
3. In `src/pages/Profile.jsx`, display the `watchHistory` array as a horizontal scrollable `ContentRow`
4. Add a "Clear History" button that sets `watchHistory: []` in Firestore

### Relevant Context
- `arrayUnion` dedupes only on *exact object equality*; a unique `watchedAt` defeats it — hence the transaction-based prepend + dedupe-by-id + slice approach above.
- Use a transaction (not a plain `updateDoc`) so concurrent tabs don't clobber each other's history.
- The `update` rule (Sub-Task 9) permits this because it only touches `watchHistory`, leaving `role`/`status` unchanged.
- User doc path: `/users/{uid}`

---

## Sub-Task 7 — Admin Panel

**Status:** `[ ] pending`

### Intent
Build a protected admin dashboard at `/admin` accessible only to users with `role: "admin"` in Firestore. The panel allows the admin to approve, reject, and ban/unban users.

### Expected Outcomes
- `/admin` route is gated by an `AdminRoute` guard that checks `userProfile.role === "admin"`
- Admin dashboard shows a paginated/filterable list of all users with their status
- Admin can approve (set `status: "approved"`), reject/delete, or ban/unban (`status: "banned"`) any user
- "Pending" tab shows only users awaiting approval for quick actioning
- Admin account is seeded manually in Firestore (set `role: "admin"` on a specific uid)

### Todo List
1. Create `src/components/AdminRoute.jsx` — redirects non-admin users to `/` 
2. Create `src/pages/Admin.jsx` — fetches all `/users` collection from Firestore, displays in a table
3. Add tab filters: "All", "Pending", "Approved", "Banned"
4. Action buttons per row: Approve → `updateDoc status: "approved"`, Ban → `updateDoc status: "banned"`, Unban → `updateDoc status: "approved"`. **Delete:** the client SDK's `deleteUser` can only delete the *currently signed-in* user — an admin cannot delete *another* user's Auth account from the browser. So the client Delete button should `deleteDoc` the Firestore doc and/or set `status:"banned"`; a true Auth-account hard-delete requires a Cloud Function using the Admin SDK (`admin.auth().deleteUser(uid)`). **Recommended default: "ban" instead of delete**, and treat the Cloud Function as an optional later addition.
5. Add a search/filter input to find users by display name or email
6. Document the manual seeding step: in Firebase console → Firestore → users collection → target uid doc → set `role: "admin"`

### Relevant Context
- Firestore security rules must ensure: only `role === "admin"` can read all `/users`; users can only read/write their own doc
- Deleting *another* user's Firebase Auth account is impossible from the client SDK (`deleteUser` only affects the caller) — it requires the Admin SDK in a Cloud Function. For simplicity, admin sets `status: "banned"` instead of full deletion; a Cloud Function can be added later for hard deletes
- Admin panel should be visually distinct (e.g. light sidebar, table layout) but can reuse Tailwind components

---

## Sub-Task 8 — Routing, Navbar & Layout

**Status:** `[ ] pending`

### Intent
Wire up all routes using React Router v6, build the persistent Navbar with user avatar/name, and ensure the correct layout is applied to each page group.

### Expected Outcomes
- All routes defined in `src/App.jsx` with proper guards applied
- Navbar shows logo, nav links (Home, Movies, Series, Search), user avatar dropdown (Profile, Logout)
- Navbar hidden on `/login`, `/register`, `/pending`, `/banned`, and `/watch/*` pages
- Mobile-responsive hamburger menu for the Navbar

### Todo List
1. Define routes in `src/App.jsx`:
   - Public: `/login`, `/register`
   - Pending only: `/pending`, `/banned`
   - Approved users: `/` (Home), `/movies`, `/series`, `/search`, `/detail/:type/:id`, `/watch/:type/:id`, `/watch/tv/:id/:season/:episode`, `/download/:type/:id`, `/profile`
   - Admin only: `/admin`
   - Catch-all: `*` → a `NotFound` page (404)
   - Note: all guards are **client-side UX only** — actual authorization is enforced by the Firestore rules in Sub-Task 9.
2. Create `src/components/Navbar.jsx` — logo left, links center, avatar dropdown right
3. Avatar dropdown: shows display name, avatar icon, links to `/profile`, and a Logout button
4. Create `src/pages/Movies.jsx` and `src/pages/Series.jsx` — genre-filtered TMDB content pages
5. Apply `bg-[#141414] text-white min-h-screen` base layout

### Relevant Context
- React Router v6 `<Outlet>` pattern for layout wrapping
- Navbar scroll behaviour: transparent at top of page, solid dark on scroll (CSS `scroll` event or `IntersectionObserver`)

---

## Sub-Task 9 — Firestore Security Rules & Hosting Config

**Status:** `[ ] pending`

### Intent
Lock down Firestore so users can read/write **only their own non-privileged fields**, only admins can change `role`/`status` or manage the collection, and no self-approval/self-admin is possible. Also add the Firebase Hosting config the SPA needs (route rewrite + global CSP headers).

> ⚠️ **Critical:** the client-side guards (`ApprovedRoute`, `AdminRoute`) are UX only. The *real* access gate is these rules. If a user can write their own `status`/`role`, they can self-approve and self-promote to admin from the browser console — defeating the entire approval model. Field-level validation below is mandatory, not optional.

### Expected Outcomes
- Firestore rules deployed that enforce:
  - users read their own doc; admins read all docs; no public read
  - users **create** their own doc only with forced defaults (`role: "user"`, `status: "pending"`)
  - users **update** only `displayName` and `avatar` — any change to `role` or `status` is rejected
  - only admins can change `role`/`status` or delete docs
- `firebase.json` with an SPA rewrite (`**` → `/index.html`) so deep-link refresh works
- Global CSP set via **Hosting headers** (not a per-route meta tag — see Sub-Task 5)

### Todo List
1. Write `firestore.rules`:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       function isSelf(uid)  { return request.auth != null && request.auth.uid == uid; }
       function isAdmin()    { return request.auth != null &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin"; }

       match /users/{uid} {
         allow read: if isSelf(uid) || isAdmin();

         // Registration: own doc only, defaults forced, cannot self-elevate
         allow create: if isSelf(uid)
           && request.resource.data.role == "user"
           && request.resource.data.status == "pending";

         // Self edit: profile fields only; role & status must be UNCHANGED
         allow update: if isSelf(uid)
           && request.resource.data.role == resource.data.role
           && request.resource.data.status == resource.data.status;

         // Admin can change status/role and delete
         allow update, delete: if isAdmin();
       }
     }
   }
   ```
2. Write `firebase.json` with SPA rewrite + CSP headers:
   ```json
   {
     "firestore": { "rules": "firestore.rules" },
     "hosting": {
       "public": "dist",
       "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
       "rewrites": [{ "source": "**", "destination": "/index.html" }],
       "headers": [{
         "source": "**",
         "headers": [{
           "key": "Content-Security-Policy",
           "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https://image.tmdb.org data:; connect-src 'self' https://api.themoviedb.org https://*.googleapis.com https://*.firebaseio.com; frame-src https://vidsrc.me https://embed.su https://dl.vidsrc.me https://www.youtube.com"
         }]
       }]
     }
   }
   ```
3. Deploy: `firebase deploy --only firestore:rules,hosting`
4. Verify rules in Firebase console Rules Playground — explicitly test that a `user` updating their own doc to `status:"approved"` or `role:"admin"` is **denied**.

### Relevant Context
- Firestore rules use `get()` to fetch the requesting user's role doc (costs one document read per evaluated request; acceptable for this app's volume).
- The `create` rule must not block first-time registration — it allows the own-doc write but forces safe defaults.
- `connect-src` in the CSP must include the Firebase/Google endpoints or Auth/Firestore calls will be blocked — tune the domains to your project.
- Tighten `script-src`/`style-src` further before production if you remove inline styles.

---

## Architecture Diagram

```
User Browser
│
├── /login, /register ──────────────────── Firebase Auth
│                                                 │
├── /pending, /banned                      Firestore /users/{uid}
│                                           { status, role, avatar, displayName, watchHistory }
├── / (Home)
│   ├── ContentRow (Trending)  ──────────  TMDB API
│   ├── ContentRow (Movies)    ──────────  TMDB API
│   └── ContentRow (Series)    ──────────  TMDB API
│
├── /detail/:type/:id  ─────────────────── TMDB API (details + trailer)
│
├── /watch/:type/:id  ──────────────────── vidsrc.me / embed.su (sandboxed iframe)
│
├── /download/:type/:id  ───────────────── dl.vidsrc.me (sandboxed iframe)
│
├── /profile  ──────────────────────────── Firestore (read/write own doc)
│
└── /admin  ────────────────────────────── Firestore (admin reads all /users)
```

---

## Firestore Data Schema

```
/users/{uid}
  - uid: string
  - email: string
  - displayName: string
  - avatar: string              // e.g. "avatar3"
  - role: "user" | "admin"
  - status: "pending" | "approved" | "banned"
  - createdAt: timestamp
  - watchHistory: [
      { id, type, title, posterPath, watchedAt }
    ]
```

---

## Notes & Decisions

- **No subscription**: Access is binary — pending or approved. Admin manually approves each user.
- **Access is enforced in Firestore rules, not the client**: `ApprovedRoute`/`AdminRoute` are UX only. The rules (Sub-Task 9) forbid users from writing their own `role`/`status`, which is what actually prevents self-approval and self-promotion to admin. This is the single most important correctness property of the app.
- **Pop-up / phishing prevention (correct model)**: The `<iframe>` `sandbox` attribute — omitting `allow-popups`, `allow-popups-to-escape-sandbox`, `allow-top-navigation`, and `allow-modals` — is what blocks pop-ups and redirects from the embed. CSP `frame-src` is a *separate* control that only limits which domains this app may frame; it does **not** stop the child from popping up or navigating. Both are used, doing different jobs.
- **CSP is global, set via Hosting headers**: A Vite SPA has one `index.html`, so a `<meta>` CSP is parsed once and cannot vary per route. CSP is therefore defined in `firebase.json` Hosting headers (Sub-Task 9), covering all embed domains at once. (`sandbox`/`frame-ancestors` directives don't work in meta tags anyway.)
- **Real-time approval**: `AuthContext` subscribes to the user doc via `onSnapshot`, so when an admin flips `status` to `approved`, a pending user's screen transitions to the app instantly — no re-login and no email needed.
- **Source reliability (known risk)**: `vidsrc.me`, `embed.su`, and `dl.vidsrc.me` are unofficial aggregators — they rotate domains, go down, and may render blank under a strict sandbox. Mitigations: config-driven source list (swap domains without redeploy), an "alternate source" button, and a visible "source didn't load" fallback on Watch/Download. Legal/ToS exposure of these sources is a project-owner decision, flagged here for awareness.
- **TMDB is metadata only**: TMDB does not host video. It provides titles, posters, backdrops, cast, and YouTube trailer keys. Actual streaming comes from vidsrc.me/embed.su.
- **Public client config**: `VITE_*` env vars (TMDB key, Firebase config) are embedded in the client bundle and are not secret — this is expected. Never place a real secret in a `VITE_` var.
- **Admin seeding**: The first admin account is set manually in the Firebase console. There is no self-signup for admin role.
- **Admin delete limitation**: The client SDK cannot delete another user's Auth account; the admin panel bans (sets `status:"banned"`) by default, with a Cloud Function (Admin SDK) as an optional path for hard deletes.
- **No email notifications**: Out of scope per requirements. With real-time approval above, users no longer need to manually re-check.
- **Watch history**: stored via a Firestore transaction (prepend + dedupe-by-id + `slice(0,20)`), not `arrayUnion` (which can't dedupe unique-timestamped entries or cap atomically).
- **Download safety**: The download page uses the same iframe sandbox as the video player — the popup/navigation/modal tokens are omitted to prevent phishing redirects from the download source.
