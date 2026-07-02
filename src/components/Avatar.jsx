import { getAvatar } from '../lib/avatars'
import { IMG } from '../lib/tmdb'

// An avatar id is either:
//  - a TMDB profile path ("/abc.jpg") or full URL  -> render the image
//  - a legacy color id ("avatar3")                 -> render the SVG initial
export function isImageAvatar(id) {
  return typeof id === 'string' && (id.startsWith('/') || id.startsWith('http'))
}

export default function Avatar({ id, size = 36, className = '' }) {
  if (isImageAvatar(id)) {
    const src = id.startsWith('http') ? id : IMG.profile(id, 'w185')
    return (
      <img
        src={src}
        alt="avatar"
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className={`rounded-md object-cover ${className}`}
      />
    )
  }

  const a = getAvatar(id)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`rounded-md ${className}`}
      role="img"
      aria-label="avatar"
    >
      <rect width="100" height="100" rx="16" fill={a.bg} />
      <text
        x="50"
        y="50"
        dominantBaseline="central"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontWeight="700"
        fontSize="52"
        fill="#141414"
      >
        {a.label}
      </text>
    </svg>
  )
}
