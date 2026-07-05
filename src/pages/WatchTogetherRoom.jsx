import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  createRoom,
  getRoomOnce,
  heartbeat,
  joinRoom,
  leaveRoom,
  setSelection,
  subscribeMembers,
  subscribeRoom,
  updatePlayback,
} from '../lib/rooms'
import { LEGAL_LIBRARY, getLibraryItem } from '../lib/legalLibrary'
import SyncPlayer from '../components/SyncPlayer'
import VideoChat from '../components/VideoChat'
import RoomChat from '../components/RoomChat'
import RoomRoster from '../components/RoomRoster'
import Spinner from '../components/Spinner'

function libItemToSelection(item) {
  if (!item) return null
  return {
    itemId: item.id,
    title: item.title,
    poster: item.poster || null,
    streamUrl: item.streamUrl,
    kind: item.kind,
  }
}

export default function WatchTogetherRoom() {
  const { roomId } = useParams()
  const [params] = useSearchParams()
  const preset = params.get('preset')
  const navigate = useNavigate()
  const { currentUser, userProfile } = useAuth()

  const [room, setRoom] = useState(undefined) // undefined = loading, null = missing
  const [members, setMembers] = useState([])
  const initRef = useRef(false)

  const me = useMemo(
    () => ({
      uid: currentUser?.uid,
      name: userProfile?.displayName || 'User',
      avatar: userProfile?.avatar || 'avatar1',
    }),
    [currentUser, userProfile],
  )

  const isHost = room && room.hostUid === currentUser?.uid

  // Load existing room (join) or create a new one (become host) — once.
  useEffect(() => {
    if (!currentUser || initRef.current) return
    initRef.current = true
    ;(async () => {
      const existing = await getRoomOnce(roomId)
      if (existing) {
        await joinRoom(roomId, me, existing.hostUid === currentUser.uid ? 'host' : 'guest')
      } else {
        const sel = preset ? libItemToSelection(getLibraryItem(preset)) : null
        await createRoom(roomId, me, sel)
      }
    })().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, roomId])

  // Live subscriptions + presence heartbeat + leave on unmount.
  useEffect(() => {
    if (!currentUser) return undefined
    const unsubRoom = subscribeRoom(roomId, setRoom)
    const unsubMembers = subscribeMembers(roomId, setMembers)
    const hb = setInterval(() => heartbeat(roomId, currentUser.uid), 15000)
    return () => {
      unsubRoom()
      unsubMembers()
      clearInterval(hb)
      leaveRoom(roomId, currentUser.uid)
    }
  }, [currentUser, roomId])

  if (room === undefined) return <Spinner full label="Joining room…" />
  if (room === null)
    return <div className="p-8 text-gray-400">This room doesn’t exist anymore.</div>

  const selection = room.selection
  const onHostEvent = (pb) => isHost && updatePlayback(roomId, pb).catch(() => {})
  const pick = (item) => setSelection(roomId, libItemToSelection(item)).catch(() => {})

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-wide">Watch Together</h1>
          <p className="text-xs text-gray-500">
            Room {roomId} · {isHost ? 'You are the host' : `Host: ${room.hostName}`}
          </p>
        </div>
        <button onClick={() => navigate('/')} className="btn-secondary !py-1.5">
          Leave
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        {/* Player / picker */}
        <div>
          {selection ? (
            <>
              <SyncPlayer
                streamUrl={selection.streamUrl}
                kind={selection.kind}
                isHost={isHost}
                playback={room.playback}
                onHostEvent={onHostEvent}
              />
              <div className="mt-2 flex items-center justify-between">
                <p className="text-sm text-gray-300">{selection.title}</p>
                {isHost && (
                  <button
                    onClick={() => setSelection(roomId, null).catch(() => {})}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    Change title
                  </button>
                )}
              </div>
            </>
          ) : isHost ? (
            <div className="glass-card p-4">
              <p className="mb-3 text-sm font-semibold text-gray-200">
                Pick a title (free library)
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {LEGAL_LIBRARY.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => pick(item)}
                    className="glass rounded-xl p-3 text-left transition hover:ring-1 hover:ring-accent"
                  >
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="text-xs text-gray-400">{item.subtitle}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="glass-card p-8 text-center text-gray-400">
              Waiting for the host to pick a title…
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="flex flex-col gap-4">
          <RoomRoster members={members} hostUid={room.hostUid} />
          <VideoChat roomId={roomId} identity={me.uid} name={me.name} />
          <div className="h-80">
            <RoomChat roomId={roomId} user={me} />
          </div>
        </div>
      </div>
    </div>
  )
}
