export type IndexedDbStoreConfig = {
  dbName: string
  storeName: string
  version: number
}

export function createIndexedDbStore<T>({ dbName, storeName, version }: IndexedDbStoreConfig) {
  function openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB indisponivel neste ambiente.'))
        return
      }

      const request = indexedDB.open(dbName, version)

      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' })
        }
      }

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async function withStore<R>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<R>) {
    const db = await openDb()

    return new Promise<R>((resolve, reject) => {
      const transaction = db.transaction(storeName, mode)
      const request = run(transaction.objectStore(storeName))

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
      transaction.oncomplete = () => db.close()
      transaction.onerror = () => {
        db.close()
        reject(transaction.error)
      }
    })
  }

  return {
    getAll() {
      return withStore<T[]>('readonly', (store) => store.getAll())
    },

    put(value: T) {
      return withStore<IDBValidKey>('readwrite', (store) => store.put(value))
    },
  }
}
