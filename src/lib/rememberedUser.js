// Remembers the last signed-in user on this device for the "welcome back"
// quick-login card. Stores only non-sensitive display info + email (never the
// password). Persists across logout so returning users get one-tap re-login.
const KEY = 'dalevision:lastUser'

export function getRememberedUser() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setRememberedUser(user) {
  try {
    if (!user?.email) return
    localStorage.setItem(
      KEY,
      JSON.stringify({
        email: user.email,
        displayName: user.displayName || '',
        avatar: user.avatar || 'avatar1',
      }),
    )
  } catch {
    /* ignore storage errors (private mode, etc.) */
  }
}

export function clearRememberedUser() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
