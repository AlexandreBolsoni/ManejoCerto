import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { firestoreDb } from '../../lib/firebase'
import type { Feedback } from '../../types'

export const feedbackRepository = {
  async save(userId: string, feedback: Feedback) {
    if (!firestoreDb) return

    await addDoc(collection(firestoreDb, 'users', userId, 'feedbacks'), {
      ...feedback,
      createdAt: serverTimestamp(),
    })
  },
}
