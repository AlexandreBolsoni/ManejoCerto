import type { Farm } from '../types'
import { placeSearchService } from './placeSearchService'
import { localStorageAdapter } from './storage'

const INMET_NEAREST_STATION_URL = 'https://apiprevmet3.inmet.gov.br/estacao/proxima'
const CACHE_PREFIX = 'nimbo:inmet-observation:v1'
const CACHE_MAX_AGE_MS = 90 * 60 * 1000
const REQUEST_TIMEOUT_MS = 8_000
const FRESH_OBSERVATION_HOURS = 3

type InmetNearestStationResponse = {
  estacao?: {
    UF?: string
    CODIGO?: string
    LONGITUDE?: string
    REGIAO?: string
    DISTANCIA_EM_KM?: string
    NOME?: string
    LATITUDE?: string
    GEOCODE?: string
  }
  dados?: {
    DC_NOME?: string
    PRE_INS?: string
    TEM_SEN?: string
    VL_LATITUDE?: string
    UF?: string
    RAD_GLO?: string
    VEN_DIR?: string
    DT_MEDICAO?: string
    CHUVA?: string
    VEN_VEL?: string
    VEN_RAJ?: string
    TEM_INS?: string
    UMD_INS?: string
    CD_ESTACAO?: string
    HR_MEDICAO?: string
  }
}

export type InmetStationObservation = {
  station: {
    code: string
    name: string
    state: string
    region?: string
    distanceKm?: number
    latitude: number
    longitude: number
    geocode?: number
  }
  observedAt: string
  ageHours: number
  isFresh: boolean
  temperatureC?: number
  feelsLikeC?: number
  humidityPct?: number
  rainMm?: number
  windKmh?: number
  gustKmh?: number
  windDirectionDeg?: number
  pressureHpa?: number
  solarRadiationKjM2?: number
  sourceUrl: string
  dataQualityLabel: string
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function parseInmetNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return undefined
  const parsed = Number(String(value).replace(',', '.'))
  if (!Number.isFinite(parsed) || Math.abs(parsed) >= 9999) return undefined
  return parsed
}

function inmetObservedAt(date?: string, hour?: string) {
  if (!date || !hour) return null
  const normalizedHour = hour.padStart(4, '0').slice(0, 4)
  const timestamp = new Date(`${date}T${normalizedHour.slice(0, 2)}:${normalizedHour.slice(2, 4)}:00Z`)
  return Number.isNaN(timestamp.getTime()) ? null : timestamp
}

export function mapInmetObservation(payload: InmetNearestStationResponse, now = new Date()): InmetStationObservation | null {
  const station = payload.estacao
  const data = payload.dados
  const observedAt = inmetObservedAt(data?.DT_MEDICAO, data?.HR_MEDICAO)
  const latitude = parseInmetNumber(station?.LATITUDE ?? data?.VL_LATITUDE)
  const longitude = parseInmetNumber(station?.LONGITUDE)
  const code = station?.CODIGO ?? data?.CD_ESTACAO
  const name = station?.NOME ?? data?.DC_NOME

  if (!station || !data || !observedAt || latitude === undefined || longitude === undefined || !code || !name) return null

  const ageHours = Math.max(0, (now.getTime() - observedAt.getTime()) / 3_600_000)
  const windMs = parseInmetNumber(data.VEN_VEL)
  const gustMs = parseInmetNumber(data.VEN_RAJ)

  return {
    station: {
      code,
      name,
      state: station.UF ?? data.UF ?? '',
      region: station.REGIAO,
      distanceKm: parseInmetNumber(station.DISTANCIA_EM_KM),
      latitude,
      longitude,
      geocode: parseInmetNumber(station.GEOCODE),
    },
    observedAt: observedAt.toISOString(),
    ageHours,
    isFresh: ageHours <= FRESH_OBSERVATION_HOURS,
    temperatureC: parseInmetNumber(data.TEM_INS),
    feelsLikeC: parseInmetNumber(data.TEM_SEN),
    humidityPct: parseInmetNumber(data.UMD_INS),
    rainMm: parseInmetNumber(data.CHUVA),
    windKmh: windMs === undefined ? undefined : Number((windMs * 3.6).toFixed(1)),
    gustKmh: gustMs === undefined ? undefined : Number((gustMs * 3.6).toFixed(1)),
    windDirectionDeg: parseInmetNumber(data.VEN_DIR),
    pressureHpa: parseInmetNumber(data.PRE_INS),
    solarRadiationKjM2: parseInmetNumber(data.RAD_GLO),
    sourceUrl: `https://tempo.inmet.gov.br/TabelaEstacoes/${code}`,
    dataQualityLabel:
      'Observação horária bruta da estação automática do INMET. Sensores podem apresentar ausência, pane ou valores ainda não consistidos.',
  }
}

function cacheKey(municipalityId: number) {
  return `${CACHE_PREFIX}:${municipalityId}`
}

function loadCachedObservation(municipalityId: number) {
  const observation = localStorageAdapter.getJson<InmetStationObservation>(cacheKey(municipalityId))
  if (!observation) return null

  const capturedAt = new Date(observation.observedAt).getTime()
  if (!Number.isFinite(capturedAt) || Date.now() - capturedAt > 48 * 60 * 60 * 1000) return null
  return observation
}

function saveCachedObservation(municipalityId: number, observation: InmetStationObservation) {
  localStorageAdapter.setJson(cacheKey(municipalityId), observation)
}

async function resolveMunicipalityId(farm: Farm) {
  if (farm.municipalityId) return farm.municipalityId
  if (!farm.state || !farm.municipality) return null

  const places = await placeSearchService.searchPlaces(farm.state, farm.municipality, 12)
  const municipality = places.find((place) => normalizeText(place.municipalityName) === normalizeText(farm.municipality)) ?? places[0]
  return municipality?.municipalityId ?? null
}

async function fetchNearestObservation(municipalityId: number) {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${INMET_NEAREST_STATION_URL}/${municipalityId}`, {
      cache: 'no-store',
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`INMET respondeu ${response.status}`)

    const observation = mapInmetObservation((await response.json()) as InmetNearestStationResponse)
    if (!observation) throw new Error('INMET não retornou observação válida')
    return observation
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export const inmetService = {
  async getNearestObservation(farm: Farm) {
    try {
      const municipalityId = await resolveMunicipalityId(farm)
      if (!municipalityId) return null

      const cached = loadCachedObservation(municipalityId)
      if (cached && Date.now() - new Date(cached.observedAt).getTime() <= CACHE_MAX_AGE_MS) return cached

      const observation = await fetchNearestObservation(municipalityId)
      saveCachedObservation(municipalityId, observation)
      return observation
    } catch (error) {
      console.warn('Nao foi possivel carregar observacao do INMET.', error)
      return null
    }
  },
}
