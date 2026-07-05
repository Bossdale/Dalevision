import { useEffect, useRef, useState } from 'react'
import { sendMessage, subscribeMessages } from '../lib/rooms'

export default function RoomChat({ roomId, user }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const endRef = useRef(null)

  useEffect(() => subscribeMessages(roomId, setMessages), [roomId])
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const submit = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    sendMessage(roomId, user, text).catch(() => {})
    setText('')
  }

  return (
    <div className="glass-card flex h-full flex-col overflow-hidden">
      <p className="border-b border-white/10 px-3 py-2 text-sm font-semibold text-gray-200">Chat</p>
      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-2">
        {messages.length === 0 && (
          <p className="text-xs text-gray-500">Say hi 👋</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className="text-sm">
            <span className={`font-semibold ${m.uid === user.uid ? 'text-accent' : 'text-gray-200'}`}>
              {m.name}:
            </span>{' '}
            <span className="text-gray-300">{m.text}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form onSubmit={submit} className="flex gap-2 border-t border-white/10 p-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message…"
          className="input flex-1 !py-2"
          maxLength={500}
        />
        <button className="btn-primary !px-4 !py-2">Send</button>
      </form>
    </div>
  )
}
