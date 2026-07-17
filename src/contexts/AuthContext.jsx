import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { setRememberedUser } from '../lib/rememberedUser'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubProfile = null

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      // Tear down any previous profile subscription.
      if (unsubProfile) {
        unsubProfile()
        unsubProfile = null
      }

      setCurrentUser(user)

      if (!user) {
        setUserProfile(null)
        setLoading(false)
        return
      }

      setLoading(true)
      // Live subscription so role/status/profile changes propagate instantly
      // (this powers real-time approval — no re-login needed).
      unsubProfile = onSnapshot(
        doc(db, 'users', user.uid),
        (snap) => {
          const profile = snap.exists() ? { uid: user.uid, ...snap.data() } : null
          setUserProfile(profile)
          setLoading(false)
          // Remember this user on-device for the "welcome back" quick login.
          if (profile) {
            setRememberedUser({
              email: profile.email || user.email,
              displayName: profile.displayName,
              avatar: profile.avatar,
            })
          }
        },
        () => {
          // Permission errors after sign-out, etc.
          setUserProfile(null)
          setLoading(false)
        },
      )
    })

    return () => {
      if (unsubProfile) unsubProfile()
      unsubAuth()
    }
  }, [])

  // Heartbeat: record the last time this user was active so admins can see
  // who's online. Writing only `lastActive` keeps role/status unchanged, which
  // the Firestore rules require for self-updates.
  useEffect(() => {
    if (!currentUser) return undefined
    const ping = () =>
      updateDoc(doc(db, 'users', currentUser.uid), { lastActive: serverTimestamp() }).catch(
        () => {},
      )
    ping()
    const iv = setInterval(ping, 60000)
    const onVisible = () => document.visibilityState === 'visible' && ping()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(iv)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [currentUser])

  const logout = () => signOut(auth)

  const value = {
    currentUser,
    userProfile,
    loading,
    isAdmin: userProfile?.role === 'admin',
    status: userProfile?.status ?? null,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
