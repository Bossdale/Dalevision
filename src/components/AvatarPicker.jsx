import { useQuery } from '@tanstack/react-query'
import { getCast, IMG } from '../lib/tmdb'
import { AVATAR_CATEGORIES } from '../lib/avatarCategories'
import { AVATARS } from '../lib/avatars'
import { RowSkeleton } from './Skeleton'

// One horizontal row of characters for a single franchise.
function FranchiseRow({ label, type, id, value, onChange }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['cast', type, id],
    queryFn: () => getCast(type, id),
    staleTime: 1000 * 60 * 60,
  })

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-gray-300">{label}</p>
      {isLoading && <RowSkeleton count={8} />}
      {isError && (
        <p className="text-xs text-gray-500">Couldn’t load (network/DNS).</p>
      )}
      {data && data.length > 0 && (
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
          {data.map((c) => {
            const active = value === c.profile_path
            return (
              <button
                key={`${c.id}-${c.character}`}
                type="button"
                onClick={() => onChange(c.profile_path)}
                className="w-16 shrink-0 text-center"
                title={`${c.character} — ${c.actor}`}
                aria-label={`Select ${c.character}`}
              >
                <div
                  className={`mx-auto h-16 w-16 overflow-hidden rounded-full ring-2 transition ${
                    active ? 'scale-105 ring-accent' : 'ring-transparent hover:ring-white/40'
                  }`}
                >
                  <img
                    src={IMG.profile(c.profile_path, 'w185')}
                    alt={c.character}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
                <p className="mt-1 line-clamp-1 text-[10px] leading-tight text-gray-400">
                  {c.character}
                </p>
              </button>
            )
          })}
        </div>
      )}
      {data && data.length === 0 && (
        <p className="text-xs text-gray-500">No characters available.</p>
      )}
    </div>
  )
}

// Categorized avatar chooser. `value` = current avatar id (TMDB path or legacy
// color id); `onChange(id)` fires on pick.
export default function AvatarPicker({ value, onChange }) {
  return (
    <div className="space-y-6">
      {AVATAR_CATEGORIES.map((cat) => (
        <FranchiseRow
          key={cat.key}
          label={cat.label}
          type={cat.type}
          id={cat.id}
          value={value}
          onChange={onChange}
        />
      ))}

      {/* Classic fallback avatars */}
      <div>
        <p className="mb-2 text-sm font-semibold text-gray-300">Classic</p>
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
          {AVATARS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onChange(a.id)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-full ring-2 transition ${
                value === a.id ? 'scale-105 ring-accent' : 'ring-transparent hover:ring-white/40'
              }`}
              aria-label={`Select ${a.id}`}
            >
              <svg viewBox="0 0 100 100" className="h-full w-full">
                <rect width="100" height="100" fill={a.bg} />
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
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
