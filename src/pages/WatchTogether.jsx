import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { newRoomId } from '../lib/rooms'

export default function WatchTogether() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const preset = params.get('preset') || ''
  const [code, setCode] = useState('')

  const create = () => {
    const id = newRoomId()
    navigate(`/watch-together/${id}${preset ? `?preset=${preset}` : ''}`)
  }
  const join = (e) => {
    e.preventDefault()
    const c = code.trim()
    if (c) navigate(`/watch-together/${c}`)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-2 font-display text-4xl tracking-wide">Watch Together</h1>
      <p className="mb-8 text-sm text-gray-400">
        Start a room, invite friends with a link, turn on your camera/mic, and watch in
        sync. Only the host controls playback.
      </p>

      <div className="glass-card mb-6 p-6">
        <h2 className="mb-2 text-lg font-semibold">Host a room</h2>
        <p className="mb-4 text-sm text-gray-400">
          Create a room, then pick a title from the free library.
        </p>
        <button onClick={create} className="btn-primary">
          Create room
        </button>
      </div>

      <div className="glass-card p-6">
        <h2 className="mb-2 text-lg font-semibold">Join a room</h2>
        <form onSubmit={join} className="flex gap-2">
          <input
            className="input"
            placeholder="Enter room code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button className="btn-secondary">Join</button>
        </form>
        <p className="mt-2 text-xs text-gray-500">
          Or just open an invite link someone shared with you.
        </p>
      </div>
    </div>
  )
}
