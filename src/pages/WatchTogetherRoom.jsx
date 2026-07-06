import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
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
  updateCue,
  updatePlayback,
} from '../lib/rooms'
import { LEGAL_LIBRARY, getLibraryItem } from '../lib/legalLibrary'
import { IMG, searchMulti, titleOf, typeOf } from '../lib/tmdb'
import useDebounce from '../hooks/useDebounce'
import SyncPlayer from '../components/SyncPlayer'
import EmbedTogether from '../components/EmbedTogether'
import VideoChat from '../components/VideoChat'
import RoomChat from '../components/RoomChat'
import RoomRoster from '../components/RoomRoster'
import Spinner from '../components/Spinner'

function libItemToSelection(item) {
  if (!item) return null
  return {
    mode: 'library',
    itemId: item.id,
    title: item.title,
    streamUrl: item.streamUrl,
    kind: item.kind,
  }
}

// Host picker shown when no title is selected: free synced library + a search
// for any TMDB title (loose-sync via embeds).
function Picker({ onPickLibrary, onPickEmbed }) {
  const [q, setQ] = useState('')
  const debounced = useDebounce(q.trim(), 300)
  const { data: results = [] } = useQuery({
    queryKey: ['wt-search', debounced],
    queryFn: () => searchMulti(debounced),
    enabled: debounced.length >= 2,
  })

  return (
    <div className="glass-card p-4">
      <p className="mb-2 text-sm font-semibold text-gray-200">Search any title (loose-sync)</p>
      <input
        className="input mb-3"
        placeholder="Search movies & series…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {results.length > 0 && (
        <div className="mb-5 grid grid-cols-3 gap-3 sm:grid-cols-5">
          {results.slice(0, 15).map((r) => (
            <button
              key={`${r.id}-${r.media_type}`}
              onClick={() =>
                onPickEmbed({
                  mode: 'embed',
                  type: typeOf(r),
                  tmdbId: r.id,
                  season: 1,
                  episode: 1,
                  serverIdx: 0,
                })
              }
              className="text-left"
              title={titleOf(r)}
            >
              {IMG.poster(r.poster_path) ? (
                <img
                  src={IMG.poster(r.poster_path)}
                  alt={titleOf(r)}
                  className="w-full rounded-lg ring-1 ring-white/10 transition hover:ring-accent"
                />
              ) : (
                <div className="flex h-32 items-center justify-center rounded-lg bg-surface p-1 text-center text-[10px] text-gray-500">
                  {titleOf(r)}
                </div>
              )}
              <p className="mt-1 line-clamp-1 text-[11px] text-gray-300">{titleOf(r)}</p>
            </button>
          ))}
        </div>
      )}

      <p className="mb-2 text-sm font-semibold text-gray-200">Free library (frame-synced)</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {LEGAL_LIBRARY.map((item) => (
          <button
            key={item.id}
            onClick={() => onPickLibrary(item)}
            className="glass rounded-xl p-3 text-left transition hover:ring-1 hover:ring-accent"
          >
            <p className="text-sm font-semibold text-white">{item.title}</p>
            <p className="text-xs text-gray-400">{item.subtitle}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function WatchTogetherRoom() {
  const { roomId } = useParams()
  const [params] = useSearchParams()
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

  useEffect(() => {
    if (!currentUser || initRef.current) return
    initRef.current = true
    ;(async () => {
      const existing = await getRoomOnce(roomId)
      if (existing) {
        await joinRoom(roomId, me, existing.hostUid === currentUser.uid ? 'host' : 'guest')
        return
      }
      // First in → become host. Seed selection from preset/embed query params.
      let sel = null
      const et = params.get('et')
      const eid = params.get('eid')
      const preset = params.get('preset')
      if (et && eid) {
        sel = {
          mode: 'embed',
          type: et,
          tmdbId: eid,
          season: Number(params.get('es')) || 1,
          episode: Number(params.get('ee')) || 1,
          serverIdx: 0,
        }
      } else if (preset) {
        sel = libItemToSelection(getLibraryItem(preset))
      }
      await createRoom(roomId, me, sel)
    })().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, roomId])

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
  const applySelection = (sel) => setSelection(roomId, sel).catch(() => {})

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

      {/* Side panel (video chat + roster + chat) sits on the RIGHT on wide
          screens AND whenever a phone/tablet is in landscape; only stacks
          below in small portrait. */}
      <div className="grid gap-4 max-lg:landscape:grid-cols-[1fr_minmax(240px,300px)] lg:grid-cols-[1fr_340px]">
        <div>
          {selection ? (
            selection.mode === 'embed' ? (
              <EmbedTogether
                selection={selection}
                isHost={isHost}
                cue={room.cue}
                onSelect={applySelection}
                onClear={() => applySelection(null)}
                onCue={(c) => updateCue(roomId, c).catch(() => {})}
              />
            ) : (
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
                      onClick={() => applySelection(null)}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      Change title
                    </button>
                  )}
                </div>
              </>
            )
          ) : isHost ? (
            <Picker onPickLibrary={(i) => applySelection(libItemToSelection(i))} onPickEmbed={applySelection} />
          ) : (
            <div className="glass-card p-8 text-center text-gray-400">
              Waiting for the host to pick a title…
            </div>
          )}
        </div>

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
