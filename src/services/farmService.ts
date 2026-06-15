import type { Farm } from '../types'
import { farmRepository } from './firebase'
import { localStorageAdapter } from './storage'

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
    const stored = localStorageAdapter.getJson<Farm>(storageKey(userId))
    const localFarms = stored ? sortFarms([stored].filter((farm) => !isSeedFarm(farm))) : []

    return farmRepository
      .listByUser(userId)
      .then((snapshot) => {
        const farms = sortFarms(snapshot.filter((farm) => !isSeedFarm(farm)))
        return farms.length > 0 ? farms : localFarms
      })
      .catch((error: unknown) => {
        console.warn('Nao foi possivel carregar fazendas do Firestore. Usando copia local.', error)
        return localFarms
      })
  },

  async saveFarm(userId: string, farm: Farm) {
    localStorageAdapter.setJson(storageKey(userId), farm)
    await farmRepository.save(userId, farm).catch((error: unknown) => {
      console.warn('Nao foi possivel salvar a fazenda no Firestore. Mantendo copia local.', error)
    })

    return farm
  },

  async deleteFarm(userId: string, farmId: string) {
    const localFarm = localStorageAdapter.getJson<Farm>(storageKey(userId))
    if (localFarm?.id === farmId) localStorageAdapter.removeItem(storageKey(userId))

    await farmRepository.delete(userId, farmId).catch((error: unknown) => {
      console.warn('Nao foi possivel apagar a fazenda no Firestore. Removendo copia local.', error)
    })
  },
}
