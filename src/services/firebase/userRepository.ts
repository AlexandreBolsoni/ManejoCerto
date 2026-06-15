import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { firestoreDb } from '../../lib/firebase'
import type { UserProfile } from '../../types'

export type AuthProfileMetadata = {
  authCreatedAt?: string | null
  lastLoginAt?: string | null
}

export const userRepository = {
  async saveProfile(profile: UserProfile, metadata: AuthProfileMetadata = {}) {
    if (!firestoreDb) return

    await setDoc(
      doc(firestoreDb, 'users', profile.id),
      {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        initials: profile.initials,
        farmName: profile.farmName,
        authCreatedAt: metadata.authCreatedAt ?? null,
        lastLoginAt: metadata.lastLoginAt ?? null,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  },
}
