import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink as completeSignInWithEmailLink,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { demoUser } from '../lib/mockData'
import { firebaseAuth, firestoreDb } from '../lib/firebase'
import type { UserProfile } from '../types'

const provider = new GoogleAuthProvider()
const emailLinkStorageKey = 'nimbo:emailForSignIn'

function mapFirebaseUser(user: User): UserProfile {
  return {
    id: user.uid,
    name: user.displayName ?? 'Produtor NibusES',
    email: user.email ?? 'produtor@nimbo.local',
    initials: (user.displayName ?? user.email ?? 'PN')
      .split(/\s|@/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join(''),
    farmName: 'Fazenda Boa Vista',
  }
}

async function saveUserProfile(user: User) {
  const profile = mapFirebaseUser(user)

  if (firestoreDb) {
    void setDoc(
      doc(firestoreDb, 'users', profile.id),
      {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        initials: profile.initials,
        farmName: profile.farmName,
        authCreatedAt: user.metadata.creationTime ?? null,
        lastLoginAt: user.metadata.lastSignInTime ?? null,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    ).catch((error: unknown) => {
      console.warn('Nao foi possivel salvar o perfil no Firestore. O login continuara com cache local.', error)
    })
  }

  return profile
}

export const authService = {
  async signInWithGoogle() {
    if (!firebaseAuth) return demoUser
    const result = await signInWithPopup(firebaseAuth, provider)
    return saveUserProfile(result.user)
  },

  async signInWithPassword(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase()

    if (!firebaseAuth) return { ...demoUser, email: normalizedEmail }

    const result = await signInWithEmailAndPassword(firebaseAuth, normalizedEmail, password)
    return saveUserProfile(result.user)
  },

  async signUpWithPassword(email: string, password: string, name: string) {
    const normalizedEmail = email.trim().toLowerCase()

    if (!firebaseAuth) {
      return {
        ...demoUser,
        email: normalizedEmail,
        name: name.trim() || demoUser.name,
      }
    }

    const result = await createUserWithEmailAndPassword(firebaseAuth, normalizedEmail, password)
    const displayName = name.trim()

    if (displayName) {
      await updateProfile(result.user, { displayName })
    }

    return saveUserProfile(result.user)
  },

  async sendEmailLink(email: string): Promise<UserProfile | null> {
    const normalizedEmail = email.trim().toLowerCase()

    if (!firebaseAuth) return { ...demoUser, email: normalizedEmail }

    await sendSignInLinkToEmail(firebaseAuth, normalizedEmail, {
      url: `${window.location.origin}/login`,
      handleCodeInApp: true,
    })

    window.localStorage.setItem(emailLinkStorageKey, normalizedEmail)
    return null
  },

  isEmailLink(url: string) {
    return Boolean(firebaseAuth && isSignInWithEmailLink(firebaseAuth, url))
  },

  async completeEmailLink(url: string) {
    if (!firebaseAuth || !isSignInWithEmailLink(firebaseAuth, url)) return null

    const storedEmail = window.localStorage.getItem(emailLinkStorageKey)
    const email = storedEmail ?? window.prompt('Confirme o e-mail usado para entrar no NibusES')

    if (!email) {
      throw new Error('E-mail necessario para concluir o login por link.')
    }

    const result = await completeSignInWithEmailLink(firebaseAuth, email, url)
    window.localStorage.removeItem(emailLinkStorageKey)

    return saveUserProfile(result.user)
  },

  async signOut() {
    if (firebaseAuth) await signOut(firebaseAuth)
  },

  onAuthChange(callback: (user: UserProfile | null) => void) {
    if (!firebaseAuth) {
      return () => undefined
    }

    return onAuthStateChanged(firebaseAuth, (user) => {
      if (!user) {
        callback(null)
        return
      }

      void saveUserProfile(user)
        .then(callback)
        .catch(() => callback(mapFirebaseUser(user)))
    })
  },
}
