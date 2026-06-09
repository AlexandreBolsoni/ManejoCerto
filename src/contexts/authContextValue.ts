import { createContext } from 'react'
import type { UserProfile } from '../types'

export type AuthContextValue = {
  user: UserProfile | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithPassword: (email: string, password: string) => Promise<void>
  signUpWithPassword: (email: string, password: string, name: string) => Promise<void>
  signInWithEmail: (email: string) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
