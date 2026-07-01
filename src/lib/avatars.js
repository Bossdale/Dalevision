// 12 preset avatars rendered as inline SVG (no external requests, no file assets).
// Stored on the user doc as a string id, e.g. "avatar3".
export const AVATARS = [
  { id: 'avatar1', bg: '#E50914', label: 'D' },
  { id: 'avatar2', bg: '#F5A623', label: 'M' },
  { id: 'avatar3', bg: '#7ED321', label: 'S' },
  { id: 'avatar4', bg: '#4A90E2', label: 'A' },
  { id: 'avatar5', bg: '#9013FE', label: 'K' },
  { id: 'avatar6', bg: '#50E3C2', label: 'R' },
  { id: 'avatar7', bg: '#B8E986', label: 'T' },
  { id: 'avatar8', bg: '#BD10E0', label: 'L' },
  { id: 'avatar9', bg: '#F8E71C', label: 'N' },
  { id: 'avatar10', bg: '#FF6F61', label: 'V' },
  { id: 'avatar11', bg: '#00A8E8', label: 'C' },
  { id: 'avatar12', bg: '#E67E22', label: 'J' },
]

export const DEFAULT_AVATAR = 'avatar1'

export const getAvatar = (id) =>
  AVATARS.find((a) => a.id === id) || AVATARS[0]
