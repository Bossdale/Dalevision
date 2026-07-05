import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'

// Short shareable room code.
export const newRoomId = () => crypto.randomUUID().slice(0, 8)

const roomRef = (id) => doc(db, 'rooms', id)
const memberRef = (id, uid) => doc(db, 'rooms', id, 'members', uid)

export const getRoomOnce = async (id) => {
  const s = await getDoc(roomRef(id))
  return s.exists() ? { id: s.id, ...s.data() } : null
}

export async function createRoom(id, host, selection = null) {
  await setDoc(roomRef(id), {
    hostUid: host.uid,
    hostName: host.name || 'Host',
    createdAt: serverTimestamp(),
    status: 'open',
    selection,
    playback: { state: 'paused', positionSeconds: 0, updatedAt: Date.now() },
  })
  await joinRoom(id, host, 'host')
}

export async function joinRoom(id, user, role = 'guest') {
  await setDoc(
    memberRef(id, user.uid),
    {
      name: user.name || 'Guest',
      avatar: user.avatar || 'avatar1',
      role,
      joinedAt: serverTimestamp(),
      lastSeen: Date.now(),
    },
    { merge: true },
  )
}

export const leaveRoom = (id, uid) => deleteDoc(memberRef(id, uid)).catch(() => {})

export const heartbeat = (id, uid) =>
  updateDoc(memberRef(id, uid), { lastSeen: Date.now() }).catch(() => {})

// Host-only writes (enforced by security rules).
export const setSelection = (id, selection) =>
  updateDoc(roomRef(id), {
    selection,
    playback: { state: 'paused', positionSeconds: 0, updatedAt: Date.now() },
    cue: null,
  })

export const updatePlayback = (id, playback) =>
  updateDoc(roomRef(id), { playback: { ...playback, updatedAt: Date.now() } })

// Shared "3-2-1" countdown cue (host-triggered). { at: <ms epoch> }.
export const updateCue = (id, cue) => updateDoc(roomRef(id), { cue })

export const closeRoom = (id) => updateDoc(roomRef(id), { status: 'closed' })

export async function sendMessage(id, user, text) {
  const t = (text || '').trim()
  if (!t) return
  await addDoc(collection(db, 'rooms', id, 'messages'), {
    uid: user.uid,
    name: user.name || 'User',
    text: t.slice(0, 500),
    at: serverTimestamp(),
  })
}

// Subscriptions.
export const subscribeRoom = (id, cb) =>
  onSnapshot(roomRef(id), (s) => cb(s.exists() ? { id: s.id, ...s.data() } : null))

export const subscribeMembers = (id, cb) =>
  onSnapshot(collection(db, 'rooms', id, 'members'), (s) =>
    cb(s.docs.map((d) => ({ uid: d.id, ...d.data() }))),
  )

export const subscribeMessages = (id, cb) =>
  onSnapshot(
    query(collection(db, 'rooms', id, 'messages'), orderBy('at', 'asc'), limit(200)),
    (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
  )
