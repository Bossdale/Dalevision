import { getAvatar } from '../lib/avatars'

// Renders a preset avatar as an inline SVG circle with an initial.
export default function Avatar({ id, size = 36, className = '' }) {
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
