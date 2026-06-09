import { collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore'
import { firestoreDb } from '../lib/firebase'
import type { Farm } from '../types'
import { withoutUndefined } from '../utils/firestoreData'

function storageKey(userId: string) {
  return `nimbo:${userId}:farm`
}

function isSeedFarm(farm: Farm) {
  return farm.id.includes('farm-boa-vista') || (farm.name === 'Fazenda Boa Vista' && farm.municipality === 'Sorriso')
}

function timestampValue(value: unknown) {
  if (!value) return 0
  if (typeof value === 'number') return value
  if (typeof value === 'string') return new Date(value).getTime() || 0
  if (typeof value === 'object' && value !== null) {
    const timestamp = value as { seconds?: number; toMillis?: () => number }
    if (typeof timestamp.toMillis === 'function') return timestamp.toMillis()
    if (typeof timestamp.seconds === 'number') return timestamp.seconds * 1000
  }
  return 0
}

function farmRank(farm: Farm & { updatedAt?: unknown }) {
  return (farm.state?.trim() ? 100 : 0) + (farm.coordinates ? 30 : 0) + (farm.municipality?.trim() ? 20 : 0) + (farm.locationLabel?.trim() ? 10 : 0)
}

function sortFarms(farms: Farm[]) {
  return [...farms].sort((left, right) => {
    const rankDiff = farmRank(right) - farmRank(left)
    if (rankDiff !== 0) return rankDiff

    return timestampValue((right as Farm & { updatedAt?: unknown }).updatedAt) - timestampValue((left as Farm & { updatedAt?: unknown }).updatedAt)
  })
}

export const farmService = {
  async listFarms(userId: string) {
    const stored = localStorage.getItem(storageKey(userId))
    const localFarms = stored ? sortFarms([JSON.parse(stored) as Farm].filter((farm) => !isSeedFarm(farm))) : []

    if (!firestoreDb || userId === 'demo-user') return localFarms

    return getDocs(collection(firestoreDb, 'users', userId, 'farms'))
      .then((snapshot) => {
        const farms = sortFarms(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Farm).filter((farm) => !isSeedFarm(farm)))
        return farms.length > 0 ? farms : localFarms
      })
      .catch((error: unknown) => {
        console.warn('Nao foi possivel carregar fazendas do Firestore. Usando copia local.', error)
        return localFarms
      })
  },

  async saveFarm(userId: string, farm: Farm) {
    localStorage.setItem(storageKey(userId), JSON.stringify(farm))

    if (firestoreDb && userId !== 'demo-user') {
      await setDoc(doc(firestoreDb, 'users', userId, 'farms', farm.id), {
        ...withoutUndefined(farm),
        updatedAt: serverTimestamp(),
      }, { merge: true }).catch((error: unknown) => {
        console.warn('Nao foi possivel salvar a fazenda no Firestore. Mantendo copia local.', error)
      })
    }

    return farm
  },

  async deleteFarm(userId: string, farmId: string) {
    const stored = localStorage.getItem(storageKey(userId))
    const localFarm = stored ? (JSON.parse(stored) as Farm) : null
    if (localFarm?.id === farmId) localStorage.removeItem(storageKey(userId))

    if (firestoreDb && userId !== 'demo-user') {
      await deleteDoc(doc(firestoreDb, 'users', userId, 'farms', farmId)).catch((error: unknown) => {
        console.warn('Nao foi possivel apagar a fazenda no Firestore. Removendo copia local.', error)
      })
    }
  },
}
