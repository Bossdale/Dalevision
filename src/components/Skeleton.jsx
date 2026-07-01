export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded bg-white/10 ${className}`} />
}

// A row of poster-shaped skeletons for loading states.
export function RowSkeleton({ count = 6 }) {
  return (
    <div className="no-scrollbar flex gap-3 overflow-hidden px-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-44 w-28 shrink-0 rounded-xl sm:h-52 sm:w-36" />
      ))}
    </div>
  )
}
