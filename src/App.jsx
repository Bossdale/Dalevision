import { lazy, Suspense, useState } from 'react'
import { Routes, Route } from 'react-router-dom'

import Splash from './components/Splash'
import Spinner from './components/Spinner'
import Layout from './components/Layout'
import PrivateRoute from './components/PrivateRoute'
import ApprovedRoute from './components/ApprovedRoute'
import AdminRoute from './components/AdminRoute'

import Login from './pages/Login'
import Register from './pages/Register'
import Pending from './pages/Pending'
import Banned from './pages/Banned'
import SelectAvatar from './pages/SelectAvatar'
import Home from './pages/Home'
import Movies from './pages/Movies'
import Series from './pages/Series'
import Search from './pages/Search'
import Detail from './pages/Detail'
import Watch from './pages/Watch'
import Download from './pages/Download'
// Lazy-loaded so the heavy LiveKit/hls.js chunks only download when a user
// actually opens Watch Together.
const WatchTogether = lazy(() => import('./pages/WatchTogether'))
const WatchTogetherRoom = lazy(() => import('./pages/WatchTogetherRoom'))
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import NotFound from './pages/NotFound'

export default function App() {
  // Show the logo-animation splash once per browser session (survives refresh,
  // replays on a new session). The app renders behind it and is revealed by the
  // smooth fade-out.
  const [showSplash, setShowSplash] = useState(
    () => !sessionStorage.getItem('dalevision:splashSeen'),
  )
  const finishSplash = () => {
    sessionStorage.setItem('dalevision:splashSeen', '1')
    setShowSplash(false)
  }

  return (
    <>
      {showSplash && <Splash onFinish={finishSplash} />}
      <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Signed-in (any status) */}
      <Route element={<PrivateRoute />}>
        <Route path="/pending" element={<Pending />} />
        <Route path="/banned" element={<Banned />} />
        {/* First-time avatar onboarding — any signed-in status */}
        <Route path="/select-avatar" element={<SelectAvatar />} />


        {/* Approved users only */}
        <Route element={<ApprovedRoute />}>
          {/* Chrome-free full-screen player/download pages */}
          <Route path="/watch/:type/:id" element={<Watch />} />
          <Route path="/watch/:type/:id/:season/:episode" element={<Watch />} />
          <Route path="/download/:type/:id" element={<Download />} />

          {/* Pages with the persistent navbar layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/series" element={<Series />} />
            <Route path="/search" element={<Search />} />
            <Route path="/detail/:type/:id" element={<Detail />} />
            <Route
              path="/watch-together"
              element={
                <Suspense fallback={<Spinner full label="Loading…" />}>
                  <WatchTogether />
                </Suspense>
              }
            />
            <Route
              path="/watch-together/:roomId"
              element={
                <Suspense fallback={<Spinner full label="Joining room…" />}>
                  <WatchTogetherRoom />
                </Suspense>
              }
            />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Admin only */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}
