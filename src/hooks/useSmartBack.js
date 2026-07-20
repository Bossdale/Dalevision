import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

// "Back" that returns the user to wherever they actually came from instead of
// always jumping to a fixed page. Pops the history stack when there's an
// in-app entry to go back to; falls back to `fallback` for deep links / fresh
// loads (where popping would leave the app entirely).
//
// React Router records a numeric `idx` on history.state — idx > 0 means there
// is a previous in-app entry we can safely return to.
export default function useSmartBack(fallback = '/') {
  const navigate = useNavigate()
  return useCallback(() => {
    const idx = window.history.state?.idx
    if (typeof idx === 'number' && idx > 0) navigate(-1)
    else navigate(fallback, { replace: true })
  }, [navigate, fallback])
}
