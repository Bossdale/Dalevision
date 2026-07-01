import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

// Standard app layout with the persistent Navbar. Pages that need a chrome-free
// full screen (Watch / Download) do not use this layout.
export default function Layout() {
  return (
    <div className="min-h-screen bg-base text-white">
      <Navbar />
      <main className="pt-16">
        <Outlet />
      </main>
    </div>
  )
}
