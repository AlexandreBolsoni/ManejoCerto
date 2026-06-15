import { doc, getDoc, setDoc } from 'firebase/firestore'
import { firestoreDb } from '../../lib/firebase'

function safeKey(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 180)
}

function canUseFirestore(userId: string | undefined): userId is string {
  return Boolean(firestoreDb && userId && userId !== 'demo-user')
}

export const weatherCacheRepository = {
  async get<T>(userId: string | undefined, key: string) {
    if (!firestoreDb || !canUseFirestore(userId)) return null

    const snapshot = await getDoc(doc(firestoreDb, 'users', userId, 'weather_cache', safeKey(key)))
    return snapshot.exists() ? (snapshot.data() as T) : null
  },

  async save<T>(userId: string | undefined, key: string, document: T) {
    if (!firestoreDb || !canUseFirestore(userId)) return

    await setDoc(doc(firestoreDb, 'users', userId, 'weather_cache', safeKey(key)), JSON.parse(JSON.stringify(document)) as Record<string, unknown>)
  },
}
