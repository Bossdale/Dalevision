import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import SandboxedFrame from '../components/SandboxedFrame'
import { DOWNLOAD_SOURCES, buildUrl } from '../lib/sources'
import { getDetails, titleOf } from '../lib/tmdb'
import useSmartBack from '../hooks/useSmartBack'

const AUTO_TIMEOUT_MS = 7000

export default function Download() {
  const { type, id } = useParams()
  const [params] = useSearchParams()
  const goBack = useSmartBack(`/detail/${type}/${id}`)

  const [sourceIdx, setSourceIdx] = useState(0)
  const [autoMode, setAutoMode] = useState(true)

  useEffect(() => {
    setSourceIdx(0)
    setAutoMode(true)
  }, [type, id])

  const source = DOWNLOAD_SOURCES[sourceIdx]

  const { data } = useQuery({
    queryKey: ['details', type, id],
    queryFn: () => getDetails(type, id),
  })
  const title = data ? titleOf(data) : ''

  const src = buildUrl(source, {
    type,
    id,
    season: Number(params.get('season')) || 1,
    episode: Number(params.get('episode')) || 1,
    title,
  })

  const isLast = sourceIdx >= DOWNLOAD_SOURCES.length - 1
  const handleTimeout = () => {
    if (autoMode && !isLast) setSourceIdx((i) => i + 1)
  }
  const handleLoaded = () => {
    if (autoMode) setAutoMode(false)
  }
  const selectServer = (i) => {
    setAutoMode(false)
    setSourceIdx(i)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center gap-3 bg-black/90 px-3 py-2 text-white">
        <button
          onClick={goBack}
          className="shrink-0 rounded bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
        >
          ‹ Back
        </button>
        <p className="hidden min-w-0 flex-1 truncate text-sm text-gray-300 sm:block">
          Download{title ? ` — ${title}` : ''}
        </p>
        {src && (
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover"
          >
            ⤢ Open in new tab
          </a>
        )}
        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
          {autoMode && (
            <span className="shrink-0 rounded bg-accent/20 px-2 py-1 text-xs text-accent">
              Auto…
            </span>
          )}
          {DOWNLOAD_SOURCES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => selectServer(i)}
              className={`shrink-0 rounded px-2.5 py-1.5 text-xs transition ${
                i === sourceIdx
                  ? 'bg-accent font-semibold text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              Server {i + 1}
            </button>
          ))}
        </div>
      </div>
      <div className="relative flex-1">
        <SandboxedFrame
          src={src}
          title="Download"
          timeoutMs={autoMode ? AUTO_TIMEOUT_MS : 8000}
          onLoaded={handleLoaded}
          onTimeout={handleTimeout}
        />
      </div>
      <p className="bg-black/90 px-3 py-1.5 text-center text-xs text-gray-500">
        If the download page is blank, it’s blocking embedding — use{' '}
        <span className="text-gray-300">Open in new tab</span>.
      </p>
    </div>
  )
}
