import { collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore'
import { firestoreDb } from '../../lib/firebase'
import type { Field } from '../../types'
import { withoutUndefined } from '../../utils/firestoreData'

function canUseFirestore(userId: string) {
  return Boolean(firestoreDb && userId !== 'demo-user')
}

export const fieldRepository = {
  async listByFarm(userId: string, farmId: string) {
    if (!firestoreDb || !canUseFirestore(userId)) return []

    const snapshot = await getDocs(collection(firestoreDb, 'users', userId, 'farms', farmId, 'fields'))
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Field)
  },

  async save(userId: string, farmId: string, field: Field) {
    if (!firestoreDb || !canUseFirestore(userId)) return

    await setDoc(
      doc(firestoreDb, 'users', userId, 'farms', farmId, 'fields', field.id),
      {
        ...withoutUndefined(field),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  },

  async delete(userId: string, farmId: string, fieldId: string) {
    if (!firestoreDb || !canUseFirestore(userId)) return

    await deleteDoc(doc(firestoreDb, 'users', userId, 'farms', farmId, 'fields', fieldId))
  },
}
