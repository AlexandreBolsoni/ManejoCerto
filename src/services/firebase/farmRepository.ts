import { collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore'
import { firestoreDb } from '../../lib/firebase'
import type { Farm } from '../../types'
import { withoutUndefined } from '../../utils/firestoreData'

function canUseFirestore(userId: string) {
  return Boolean(firestoreDb && userId !== 'demo-user')
}

export const farmRepository = {
  async listByUser(userId: string) {
    if (!firestoreDb || !canUseFirestore(userId)) return []

    const snapshot = await getDocs(collection(firestoreDb, 'users', userId, 'farms'))
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Farm)
  },

  async save(userId: string, farm: Farm) {
    if (!firestoreDb || !canUseFirestore(userId)) return

    await setDoc(
      doc(firestoreDb, 'users', userId, 'farms', farm.id),
      {
        ...withoutUndefined(farm),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  },

  async delete(userId: string, farmId: string) {
    if (!firestoreDb || !canUseFirestore(userId)) return

    await deleteDoc(doc(firestoreDb, 'users', userId, 'farms', farmId))
  },
}
