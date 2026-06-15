import type { Farm } from '../../../types'
import { firebaseAuth } from '../../../lib/firebase'
import type { WeatherProviderStatus } from '../types'
import type { WeatherProviderAdapter } from './types'

const NIBUSES_API_URL = (
  (import.meta.env.VITE_NIBUSES_API_URL as string | undefined) ||
  (import.meta.env.VITE_NIMBO_API_URL as string | undefined) ||
  '/api'
).replace(/\/$/, '')

export type CemadenRainGauge = {
  stationCode: string
  stationName: string
  city: string
  state: string
  latitude: number
  longitude: number
  observedAt: string
  distanceKm?: number
  latestValueMm?: number
  accumulatedMm: {
    hour1?: number
    hours3?: number
    hours6?: number
    hours12?: number
    hours24?: number
    hours72?: number
  }
  qualification?: string
  sourceUrl: string
}

async function getNearestRainGauge(farm: Farm): Promise<CemadenRainGauge | null> {
  if (!farm.coordinates) return null

  try {
    await firebaseAuth?.authStateReady()
    const idToken = await firebaseAuth?.currentUser?.getIdToken()
    if (!idToken) return null

    const url = new URL(`${NIBUSES_API_URL}/weather/cemaden`, window.location.origin)
    url.searchParams.set('state', farm.state)
    url.searchParams.set('latitude', String(farm.coordinates.latitude))
    url.searchParams.set('longitude', String(farm.coordinates.longitude))

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    })
    if (!response.ok) throw new Error(`Backend NimbuES/Cemaden respondeu ${response.status}`)
    return (await response.json()) as CemadenRainGauge | null
  } catch (error) {
    console.warn('Cemaden indisponivel. A previsao principal continua ativa.', error)
    return null
  }
}

function getStatus(): WeatherProviderStatus {
  return {
    provider: 'cemaden',
    status: 'online',
  }
}

export const cemadenProvider: WeatherProviderAdapter<Farm, CemadenRainGauge | null> = {
  id: 'cemaden',
  role: 'validation',
  getData: getNearestRainGauge,
  getStatus,
}
