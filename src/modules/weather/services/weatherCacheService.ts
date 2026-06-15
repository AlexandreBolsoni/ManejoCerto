import { weatherCacheRepository } from '../../../services/firebase'
import { localStorageAdapter } from '../../../services/storage'
import type { Coordinates } from '../../../types'
import type { WeatherProvider } from '../types'

export const WEATHER_CACHE_TTL = {
  forecastHourly: 60 * 60 * 1000,
  forecastDaily: 4 * 60 * 60 * 1000,
  officialObservation: 60 * 60 * 1000,
  rainGauge: 20 * 60 * 1000,
  radarMetadata: 5 * 60 * 1000,
  weatherZones: 10 * 60 * 1000,
  history: 24 * 60 * 60 * 1000,
} as const

type CacheDocument<T> = {
  key: string
  provider: WeatherProvider
  payload: T
  fetchedAt: string
  expiresAt: string
  locationHash?: string
  farmId?: string
  fieldId?: string
}

type CacheRequest<T> = {
  key: string
  provider: WeatherProvider
  ttlMs: number
  fetcher: () => Promise<T>
  userId?: string
  coordinates?: Coordinates
  farmId?: string
  fieldId?: string
  forceRefresh?: boolean
  persistRemote?: boolean
}

const LOCAL_PREFIX = 'nimbo:weather-cache:v1'

function locationHash(coordinates?: Coordinates) {
  return coordinates ? `${coordinates.latitude.toFixed(3)}_${coordinates.longitude.toFixed(3)}` : undefined
}

function safeKey(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 180)
}

function localKey(userId: string | undefined, key: string) {
  return `${LOCAL_PREFIX}:${userId ?? 'anonymous'}:${safeKey(key)}`
}

function isFresh(document: CacheDocument<unknown>) {
  return new Date(document.expiresAt).getTime() > Date.now()
}

function stripUndefined<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function loadLocal<T>(userId: string | undefined, key: string) {
  return localStorageAdapter.getJson<CacheDocument<T>>(localKey(userId, key))
}

function saveLocal<T>(userId: string | undefined, document: CacheDocument<T>) {
  localStorageAdapter.setJson(localKey(userId, document.key), document)
}

async function loadFirestore<T>(userId: string | undefined, key: string) {
  try {
    return weatherCacheRepository.get<CacheDocument<T>>(userId, key)
  } catch (error) {
    console.warn('Nao foi possivel ler o cache meteorologico do Firestore.', error)
    return null
  }
}

async function saveFirestore<T>(userId: string | undefined, document: CacheDocument<T>) {
  await weatherCacheRepository.save(userId, document.key, stripUndefined(document)).catch((error: unknown) => {
    console.warn('Nao foi possivel salvar o cache meteorologico no Firestore.', error)
  })
}

export const weatherCacheService = {
  async getOrFetch<T>({
    coordinates,
    farmId,
    fieldId,
    fetcher,
    forceRefresh = false,
    key,
    persistRemote = true,
    provider,
    ttlMs,
    userId,
  }: CacheRequest<T>): Promise<T> {
    const local = loadLocal<T>(userId, key)
    if (!forceRefresh && local && isFresh(local)) return local.payload

    const remote = forceRefresh || !persistRemote ? null : await loadFirestore<T>(userId, key)
    if (remote && isFresh(remote)) {
      saveLocal(userId, remote)
      return remote.payload
    }

    try {
      const payload = await fetcher()
      const fetchedAt = new Date()
      const document: CacheDocument<T> = {
        key,
        provider,
        payload: stripUndefined(payload),
        fetchedAt: fetchedAt.toISOString(),
        expiresAt: new Date(fetchedAt.getTime() + ttlMs).toISOString(),
        locationHash: locationHash(coordinates),
        farmId,
        fieldId,
      }
      saveLocal(userId, document)
      if (persistRemote) void saveFirestore(userId, document)
      return payload
    } catch (error) {
      const stale = local ?? remote
      if (stale) {
        console.warn('Fonte meteorologica indisponivel. Usando cache salvo.', error)
        return stale.payload
      }
      throw error
    }
  },
}
