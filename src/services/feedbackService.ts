import type { Feedback } from '../types'
import { feedbackRepository } from './firebase'
import { createIndexedDbStore } from './storage'

const DB_NAME = 'nimbo-feedback'
const STORE_NAME = 'feedbacks'
const feedbackStore = createIndexedDbStore<Feedback>({
  dbName: DB_NAME,
  storeName: STORE_NAME,
  version: 1,
})

export const feedbackService = {
  async saveFeedback(userId: string, feedback: Omit<Feedback, 'id' | 'createdAt' | 'status'>) {
    const item: Feedback = {
      ...feedback,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: navigator.onLine ? 'synced' : 'queued',
    }

    await feedbackStore.put(item)

    if (navigator.onLine) {
      await feedbackRepository.save(userId, item).catch((error: unknown) => {
        console.warn('Nao foi possivel sincronizar o feedback agora. Ele ficara salvo localmente.', error)
      })
    }

    return item
  },

  async listQueue() {
    return feedbackStore.getAll()
  },

  async markQueuedAsSynced() {
    const all = await this.listQueue()
    const queued = all.filter((item) => item.status === 'queued')

    await Promise.all(queued.map((item) => feedbackStore.put({ ...item, status: 'synced' as const })))
  },
}
