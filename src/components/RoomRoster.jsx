import { useState } from 'react'
import Avatar from './Avatar'

// Members list + host badge + Invite (copy join link).
export default function RoomRoster({ members, hostUid }) {
  const [copied, setCopied] = useState(false)

  const invite = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked */
    }
  }

  // Show only members seen in the last ~40s (filters stale/left users).
  const active = members.filter((m) => !m.lastSeen || Date.now() - m.lastSeen < 40000)

  return (
    <div className="glass-card p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-200">In the room ({active.length})</p>
        <button onClick={invite} className="btn-secondary !px-3 !py-1 text-xs">
          {copied ? 'Link copied!' : 'Invite'}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {active.map((m) => (
          <div
            key={m.uid}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 py-1 pl-1 pr-3"
            title={m.name}
          >
            <Avatar id={m.avatar} size={24} />
            <span className="text-xs text-gray-200">{m.name}</span>
            {m.uid === hostUid && (
              <span className="rounded-full bg-accent px-1.5 text-[10px] font-semibold text-white">
                HOST
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
