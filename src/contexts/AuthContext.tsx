import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import { usePersistentState } from '../hooks/usePersistentState'
import type { UserProfile } from '../types'
import { AuthContext, type AuthContextValue } from './authContextValue'

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const persistedSession = authService.getPersistedSession()
  const [storedUser, setStoredUser] = usePersistentState<UserProfile | null>('nimbo:user', persistedSession)
  const [loading, setLoading] = useState(() => Boolean(persistedSession) || authService.isEmailLink(window.location.href))

  useEffect(() => {
    if (!persistedSession && !authService.isEmailLink(window.location.href)) {
      setLoading(false)
      return undefined
    }

    const timer = window.setTimeout(() => {
      setLoading(false)
    }, 320)

    return () => {
      window.clearTimeout(timer)
    }
  }, [persistedSession])

  useEffect(() => {
    if (storedUser) {
      return undefined
    }

    return authService.onAuthChange((nextUser) => {
      setStoredUser(nextUser)
    })
  }, [setStoredUser, storedUser])

  useEffect(() => {
    if (storedUser && (location.pathname === '/' || location.pathname === '/login')) {
      navigate('/dashboard', { replace: true })
    }
  }, [location.pathname, navigate, storedUser])

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

  if (loading && (storedUser || authService.isEmailLink(window.location.href))) {
    return (
      <div className="auth-page auth-boot-screen" role="status" aria-live="polite">
        <div className="auth-boot-card">
          <div className="auth-boot-logo-wrap" aria-hidden="true">
            <img className="auth-boot-logo" src="/assets/logo-nome.png" alt="" />
            <span className="auth-boot-pulse" />
          </div>
          <div className="auth-boot-spinner" aria-hidden="true" />
          <strong>Restaurando sua sessão…</strong>
          <p>Estamos abrindo o Manejo Certo para você.</p>
        </div>
      </div>
    )
  }

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
        navigate('/', { replace: true })
      },
    }),
    [loading, navigate, setStoredUser, storedUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
