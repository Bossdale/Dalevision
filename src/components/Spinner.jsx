export default function Spinner({ label = 'Loading…', full = false }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 text-gray-400 ${
        full ? 'min-h-screen bg-base' : 'py-16'
      }`}
    >
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-600 border-t-accent" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  )
}
