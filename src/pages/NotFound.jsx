import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-5xl font-extrabold text-accent">404</h1>
      <p className="text-gray-300">This page wandered off the grid.</p>
      <Link to="/" className="btn-primary">
        Back to home
      </Link>
    </div>
  )
}
