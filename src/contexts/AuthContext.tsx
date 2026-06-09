import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import { usePersistentState } from '../hooks/usePersistentState'
import type { UserProfile } from '../types'
import { AuthContext, type AuthContextValue } from './authContextValue'

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [storedUser, setStoredUser] = usePersistentState<UserProfile | null>('nimbo:user', null)
  const [loading, setLoading] = useState(() => authService.isEmailLink(window.location.href))

  useEffect(() => {
    return authService.onAuthChange((nextUser) => {
      setStoredUser(nextUser)
    })
  }, [setStoredUser])

  useEffect(() => {
    const url = window.location.href
    if (!authService.isEmailLink(url)) return

    let cancelled = false

    authService
      .completeEmailLink(url)
      .then((nextUser) => {
        if (cancelled || !nextUser) return
        setStoredUser(nextUser)
        navigate('/dashboard', { replace: true })
      })
      .catch((error: unknown) => {
        console.error('Nao foi possivel concluir o login por link de e-mail.', error)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [location.search, navigate, setStoredUser])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: storedUser,
      loading,
      async signInWithGoogle() {
        setLoading(true)
        try {
          const nextUser = await authService.signInWithGoogle()
          setStoredUser(nextUser)
          navigate('/dashboard')
        } finally {
          setLoading(false)
        }
      },
      async signInWithPassword(email: string, password: string) {
        setLoading(true)
        try {
          const nextUser = await authService.signInWithPassword(email, password)
          setStoredUser(nextUser)
          navigate('/dashboard')
        } finally {
          setLoading(false)
        }
      },
      async signUpWithPassword(email: string, password: string, name: string) {
        setLoading(true)
        try {
          const nextUser = await authService.signUpWithPassword(email, password, name)
          setStoredUser(nextUser)
          navigate('/onboarding')
        } finally {
          setLoading(false)
        }
      },
      async signInWithEmail(email: string) {
        setLoading(true)
        try {
          const nextUser = await authService.sendEmailLink(email)

          if (nextUser) {
            setStoredUser(nextUser)
            navigate('/dashboard')
          }
        } finally {
          setLoading(false)
        }
      },
      async signOut() {
        await authService.signOut()
        setStoredUser(null)
        navigate('/login')
      },
    }),
    [loading, navigate, setStoredUser, storedUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
