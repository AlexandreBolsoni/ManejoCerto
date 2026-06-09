import type { Coordinates } from '../types'

export type LocationStatus = 'idle' | 'requesting' | 'tracking' | 'denied' | 'unavailable' | 'timeout' | 'error'

const approximateOptions: PositionOptions = {
  enableHighAccuracy: false,
  maximumAge: 30 * 60 * 1000,
  timeout: 8_000,
}

const trackingOptions: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 60_000,
  timeout: 12_000,
}

type GeoJsResponse = {
  latitude?: string | number
  longitude?: string | number
  accuracy?: string | number
}

type IpWhoisAppResponse = {
  success?: boolean
  latitude?: number
  longitude?: number
  lat?: number
  lon?: number
}

type GeolocationDbResponse = {
  latitude?: number
  longitude?: number
}

type NetworkProvider<T> = {
  name: string
  timeoutMs: number
  url: string
  parse: (data: T) => Coordinates | null
}

const networkCacheKey = 'nimbo:network-location:v1'
const networkCacheMaxAgeMs = 45 * 60 * 1000

function numberValue(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function storageAvailable() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function cacheNetworkPosition(coordinates: Coordinates) {
  if (!storageAvailable()) return

  try {
    window.localStorage.setItem(networkCacheKey, JSON.stringify(coordinates))
  } catch {
    // Cache best-effort only.
  }
}

function loadCachedNetworkPosition() {
  if (!storageAvailable()) return null

  try {
    const stored = window.localStorage.getItem(networkCacheKey)
    if (!stored) return null

    const coordinates = JSON.parse(stored) as Coordinates
    if (!coordinates.updatedAt || Date.now() - new Date(coordinates.updatedAt).getTime() > networkCacheMaxAgeMs) return null
    return coordinates
  } catch {
    return null
  }
}

function networkCoordinates(latitude: unknown, longitude: unknown, accuracyM = 50_000): Coordinates | null {
  const parsedLatitude = numberValue(latitude)
  const parsedLongitude = numberValue(longitude)

  if (parsedLatitude === null || parsedLongitude === null) return null

  return {
    latitude: parsedLatitude,
    longitude: parsedLongitude,
    accuracyM,
    source: 'rede',
    updatedAt: new Date().toISOString(),
  }
}

const networkProviders: NetworkProvider<unknown>[] = [
  {
    name: 'GeoJS',
    timeoutMs: 4_000,
    url: 'https://get.geojs.io/v1/ip/geo.json',
    parse(data) {
      const payload = data as GeoJsResponse
      const accuracyKm = numberValue(payload.accuracy)
      return networkCoordinates(payload.latitude, payload.longitude, accuracyKm ? Math.max(accuracyKm * 1000, 10_000) : 50_000)
    },
  },
  {
    name: 'ipwhois.app',
    timeoutMs: 4_000,
    url: 'https://ipwhois.app/json/',
    parse(data) {
      const payload = data as IpWhoisAppResponse
      if (payload.success === false) return null
      return networkCoordinates(payload.latitude ?? payload.lat, payload.longitude ?? payload.lon)
    },
  },
  {
    name: 'Geolocation DB',
    timeoutMs: 4_000,
    url: 'https://geolocation-db.com/json/',
    parse(data) {
      const payload = data as GeolocationDbResponse
      return networkCoordinates(payload.latitude, payload.longitude)
    },
  },
]

function toCoordinates(position: GeolocationPosition): Coordinates {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracyM: position.coords.accuracy,
    altitudeM: position.coords.altitude,
    source: 'usuario',
    updatedAt: new Date(position.timestamp).toISOString(),
  }
}

function mapError(error: GeolocationPositionError): LocationStatus {
  if (error.code === error.PERMISSION_DENIED) return 'denied'
  if (error.code === error.POSITION_UNAVAILABLE) return 'unavailable'
  if (error.code === error.TIMEOUT) return 'timeout'
  return 'error'
}

function browserPosition(options: PositionOptions): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(toCoordinates(position)),
      (error) => reject(Object.assign(error, { status: mapError(error) })),
      options,
    )
  })
}

async function networkPosition(): Promise<Coordinates> {
  const cached = loadCachedNetworkPosition()
  if (cached) return { ...cached, updatedAt: new Date().toISOString() }

  const errors: string[] = []

  for (const provider of networkProviders) {
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), provider.timeoutMs)

    try {
      const response = await fetch(provider.url, {
        cache: 'no-store',
        signal: controller.signal,
      })

      if (!response.ok) throw new Error(`${response.status}`)

      const coordinates = provider.parse(await response.json())
      if (!coordinates) throw new Error('sem coordenadas')

      cacheNetworkPosition(coordinates)
      return coordinates
    } catch (error) {
      errors.push(`${provider.name}: ${error instanceof Error ? error.message : 'falha'}`)
    } finally {
      window.clearTimeout(timeoutId)
    }
  }

  throw new Error(`Servicos de localizacao por rede indisponiveis (${errors.join('; ')}).`)
}

export const locationService = {
  isSupported() {
    return typeof navigator !== 'undefined' && 'geolocation' in navigator
  },

  getCurrentPosition(): Promise<Coordinates> {
    if (!this.isSupported()) {
      return networkPosition().catch((error: unknown) =>
        Promise.reject(Object.assign(error instanceof Error ? error : new Error('Geolocalizacao indisponivel.'), { status: 'unavailable' satisfies LocationStatus })),
      )
    }

    return browserPosition(approximateOptions).catch((error: unknown) => {
      return networkPosition().catch(() => {
        throw error
      })
    })
  },

  watchPosition(onChange: (coordinates: Coordinates) => void, onError: (status: LocationStatus) => void) {
    if (!this.isSupported()) {
      onError('unavailable')
      return undefined
    }

    return navigator.geolocation.watchPosition(
      (position) => onChange(toCoordinates(position)),
      (error) => onError(mapError(error)),
      trackingOptions,
    )
  },
}
