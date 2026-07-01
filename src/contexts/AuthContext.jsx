import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

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
          setUserProfile(snap.exists() ? { uid: user.uid, ...snap.data() } : null)
          setLoading(false)
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
