import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { firestoreDb } from '../lib/firebase'
import type { Feedback } from '../types'

const DB_NAME = 'nimbo-feedback'
const STORE_NAME = 'feedbacks'
const DB_VERSION = 1

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await openDb()

  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode)
    const request = run(transaction.objectStore(STORE_NAME))

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => db.close()
    transaction.onerror = () => {
      db.close()
      reject(transaction.error)
    }
  })
}

export const feedbackService = {
  async saveFeedback(userId: string, feedback: Omit<Feedback, 'id' | 'createdAt' | 'status'>) {
    const item: Feedback = {
      ...feedback,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: navigator.onLine ? 'synced' : 'queued',
    }

    await withStore('readwrite', (store) => store.put(item))

    if (navigator.onLine && firestoreDb) {
      await addDoc(collection(firestoreDb, 'users', userId, 'feedbacks'), {
        ...item,
        createdAt: serverTimestamp(),
      }).catch((error: unknown) => {
        console.warn('Nao foi possivel sincronizar o feedback agora. Ele ficara salvo localmente.', error)
      })
    }

    return item
  },

  async listQueue() {
    return withStore<Feedback[]>('readonly', (store) => store.getAll())
  },

  async markQueuedAsSynced() {
    const all = await this.listQueue()
    const queued = all.filter((item) => item.status === 'queued')

    await Promise.all(queued.map((item) => withStore('readwrite', (store) => store.put({ ...item, status: 'synced' as const }))))
  },
}
