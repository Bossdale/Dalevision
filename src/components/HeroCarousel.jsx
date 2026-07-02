import { useEffect, useState } from 'react'
import Hero from './Hero'

// Auto-looping featured carousel with a smooth horizontal slide.
// Pauses on hover; dots let the user jump to a slide.
export default function HeroCarousel({ items, interval = 6500 }) {
  const slides = (items || []).filter((i) => i?.backdrop_path).slice(0, 7)
  const count = slides.length
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  // Reset to the first slide if the source list changes size.
  useEffect(() => {
    setIndex(0)
  }, [count])

  // Auto-advance.
  useEffect(() => {
    if (count <= 1 || paused) return undefined
    const t = setInterval(() => setIndex((i) => (i + 1) % count), interval)
    return () => clearInterval(t)
  }, [count, paused, interval])

  if (count === 0) {
    return <div className="h-[62vh] min-h-[420px] w-full animate-pulse bg-surface" />
  }

  return (
    <div
      className="relative h-[62vh] min-h-[420px] w-full overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Sliding track */}
      <div
        className="flex h-full transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((item) => (
          <div key={item.id} className="h-full w-full shrink-0">
            <Hero item={item} />
          </div>
        ))}
      </div>

      {/* Dots */}
      {count > 1 && (
        <div className="absolute bottom-5 right-6 z-20 flex gap-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? 'w-6 bg-accent' : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
