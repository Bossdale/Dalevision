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
import { getLibraryItem } from '../lib/legalLibrary'
import { IMG, getPopularMovies, searchMulti, titleOf, typeOf } from '../lib/tmdb'
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

// Small poster button that picks a title into embed (loose-sync) mode.
function PickTile({ item, onPick }) {
  return (
    <button onClick={onPick} className="text-left" title={titleOf(item)}>
      {IMG.poster(item.poster_path) ? (
        <img
          src={IMG.poster(item.poster_path)}
          alt={titleOf(item)}
          loading="lazy"
          className="w-full rounded-lg ring-1 ring-white/10 transition hover:ring-accent"
        />
      ) : (
        <div className="flex h-32 items-center justify-center rounded-lg bg-surface p-1 text-center text-[10px] text-gray-500">
          {titleOf(item)}
        </div>
      )}
      <p className="mt-1 line-clamp-1 text-[11px] text-gray-300">{titleOf(item)}</p>
    </button>
  )
}

// Host picker: search any TMDB title + a grid of recommended top movies.
function Picker({ onPickEmbed }) {
  const [q, setQ] = useState('')
  const debounced = useDebounce(q.trim(), 300)
  const { data: results = [] } = useQuery({
    queryKey: ['wt-search', debounced],
    queryFn: () => searchMulti(debounced),
    enabled: debounced.length >= 2,
  })
  const { data: recommended = [] } = useQuery({
    queryKey: ['wt-recommended'],
    queryFn: () => getPopularMovies(),
    staleTime: 1000 * 60 * 30,
  })

  const pick = (r) =>
    onPickEmbed({
      mode: 'embed',
      type: typeOf(r),
      tmdbId: r.id,
      season: 1,
      episode: 1,
      serverIdx: 0,
    })

  return (
    <div className="glass-card p-4">
      <p className="mb-2 text-sm font-semibold text-gray-200">Search any title</p>
      <input
        className="input mb-4"
        placeholder="Search movies & series…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {results.length > 0 ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {results.slice(0, 15).map((r) => (
            <PickTile key={`${r.id}-${r.media_type}`} item={r} onPick={() => pick(r)} />
          ))}
        </div>
      ) : (
        <>
          <p className="mb-2 text-sm font-semibold text-gray-200">Recommended to watch</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {recommended.slice(0, 20).map((m) => (
              <PickTile key={m.id} item={{ ...m, media_type: 'movie' }} onPick={() => pick(m)} />
            ))}
          </div>
        </>
      )}
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
  const [isFullscreen, setIsFullscreen] = useState(false)
  const stageRef = useRef(null) // wraps movie + video tiles; this is what goes fullscreen
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
  // uid → avatar id, for showing a profile avatar when a camera is off.
  const avatars = useMemo(
    () => Object.fromEntries(members.map((m) => [m.uid, m.avatar])),
    [members],
  )

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

  // Reflect actual fullscreen state (also catches Esc-to-exit).
  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) stageRef.current?.requestFullscreen?.().catch(() => {})
    else document.exitFullscreen?.()
  }

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

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-3">
          {/* Stage = movie + video tiles. Fullscreen applies to THIS element,
              so only the movie and the video-call tiles are shown. */}
          <div
            ref={stageRef}
            className={isFullscreen ? 'flex h-full w-full flex-col bg-black' : 'space-y-3'}
          >
            <div
              className={
                isFullscreen
                  ? 'relative flex min-h-0 flex-1 items-center justify-center overflow-hidden'
                  : 'relative'
              }
            >
              <div className={isFullscreen ? 'w-full max-w-[177vh]' : 'w-full'}>
                {selection ? (
                  selection.mode === 'embed' ? (
                    <EmbedTogether
                      selection={selection}
                      isHost={isHost}
                      cue={room.cue}
                      bare={isFullscreen}
                      onSelect={applySelection}
                      onClear={() => applySelection(null)}
                      onCue={(c) => updateCue(roomId, c).catch(() => {})}
                    />
                  ) : (
                    <SyncPlayer
                      streamUrl={selection.streamUrl}
                      kind={selection.kind}
                      isHost={isHost}
                      playback={room.playback}
                      onHostEvent={onHostEvent}
                    />
                  )
                ) : isHost ? (
                  <Picker onPickEmbed={applySelection} />
                ) : (
                  <div className="glass-card p-8 text-center text-gray-400">
                    Waiting for the host to pick a title…
                  </div>
                )}
              </div>

              {selection && (
                <button
                  onClick={toggleFullscreen}
                  className="absolute right-3 top-3 z-50 rounded bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur hover:bg-black/80"
                >
                  {isFullscreen ? 'Exit ⤢' : '⛶ Fullscreen'}
                </button>
              )}
            </div>

            {/* Library title / change-title — hidden in fullscreen */}
            {selection?.mode === 'library' && !isFullscreen && (
              <div className="flex items-center justify-between gap-3">
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
            )}

            {/* Participant tiles — below the movie, inside the stage so they
                stay visible in fullscreen. */}
            <div className={isFullscreen ? 'shrink-0 p-2' : ''}>
              <VideoChat roomId={roomId} identity={me.uid} name={me.name} avatars={avatars} />
            </div>
          </div>
        </div>

        {/* Side column: roster + chat (outside the stage → hidden in fullscreen) */}
        <div className="flex flex-col gap-4">
          <RoomRoster members={members} hostUid={room.hostUid} />
          <div className="h-96">
            <RoomChat roomId={roomId} user={me} />
          </div>
        </div>
      </div>
    </div>
  )
}
