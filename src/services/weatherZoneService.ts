import type { Coordinates } from '../types'
import { WEATHER_CACHE_TTL, weatherCacheService, type WeatherGatewayOptions } from '../modules/weather'

export type WeatherZoneKind = 'heat' | 'cold' | 'cloud' | 'rain' | 'storm' | 'dry' | 'stable'
export type WeatherZonePeriod = 'today' | '6h' | '24h' | 'tomorrow'

export type WeatherZoneHour = {
  temperatureC: number
  humidityPct: number
  precipitationMm: number
  rainProbabilityPct: number
  weatherCode: number
  windKmh: number
  gustKmh: number
  windDirectionDeg: number
}

export type WeatherZone = {
  id: string
  kind: WeatherZoneKind
  label: string
  detail: string
  latitude: number
  longitude: number
  radiusM: number
  color: string
  temperatureC: number
  humidityPct: number
  precipitationMm: number
  rainProbabilityPct: number
  weatherCode: number
  windKmh: number
  gustKmh: number
  windDirectionDeg: number
  forecastHours: WeatherZoneHour[]
}

type ZoneHour = WeatherZoneHour

type ZonePoint = {
  latitude: number
  longitude: number
  hours: ZoneHour[]
}

type OpenMeteoZoneResponse = {
  hourly?: {
    temperature_2m?: number[]
    relative_humidity_2m?: number[]
    precipitation?: number[]
    precipitation_probability?: number[]
    weather_code?: number[]
    wind_speed_10m?: number[]
    wind_gusts_10m?: number[]
    wind_direction_10m?: number[]
  }
}

const REQUEST_TIMEOUT_MS = 10_000
export const WEATHER_ZONE_REFRESH_INTERVAL = 10 * 60 * 1000
const GRID_OFFSETS = [
  [0, 0],
  [2.6, 0],
  [-2.6, 0],
  [0, 2.6],
  [0, -2.6],
  [2.2, 2.2],
  [2.2, -2.2],
  [-2.2, 2.2],
  [-2.2, -2.2],
]
const BRAZIL_GRID = [
  [-3.1, -60.0],
  [-5.5, -47.5],
  [-8.2, -63.8],
  [-8.5, -39.5],
  [-12.6, -55.7],
  [-13.0, -41.8],
  [-16.7, -49.3],
  [-18.5, -44.0],
  [-20.3, -40.3],
  [-22.5, -55.7],
  [-23.5, -46.6],
  [-27.6, -51.1],
  [-30.0, -53.5],
]

function valueAt(values: number[] | undefined, index: number, fallback = 0) {
  return values?.[index] ?? values?.[0] ?? fallback
}

function mapHours(data: OpenMeteoZoneResponse) {
  const hourly = data.hourly
  const length = hourly?.temperature_2m?.length ?? 0

  return Array.from({ length }, (_, index) => ({
    temperatureC: valueAt(hourly?.temperature_2m, index),
    humidityPct: valueAt(hourly?.relative_humidity_2m, index, 60),
    precipitationMm: valueAt(hourly?.precipitation, index),
    rainProbabilityPct: valueAt(hourly?.precipitation_probability, index),
    weatherCode: valueAt(hourly?.weather_code, index),
    windKmh: valueAt(hourly?.wind_speed_10m, index),
    gustKmh: valueAt(hourly?.wind_gusts_10m, index),
    windDirectionDeg: valueAt(hourly?.wind_direction_10m, index, 270),
  }))
}

async function fetchPoint(latitude: number, longitude: number): Promise<ZonePoint> {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', latitude.toFixed(4))
  url.searchParams.set('longitude', longitude.toFixed(4))
  url.searchParams.set(
    'hourly',
    'temperature_2m,relative_humidity_2m,precipitation,precipitation_probability,weather_code,wind_speed_10m,wind_gusts_10m,wind_direction_10m',
  )
  url.searchParams.set('forecast_days', '2')
  url.searchParams.set('timezone', 'auto')

  try {
    const response = await fetch(url, { cache: 'no-store', signal: controller.signal })
    if (!response.ok) throw new Error(`Open-Meteo respondeu ${response.status}`)
    return {
      latitude,
      longitude,
      hours: mapHours((await response.json()) as OpenMeteoZoneResponse),
    }
  } finally {
    window.clearTimeout(timeoutId)
  }
}

async function loadGrid(coordinates: Coordinates, options: WeatherGatewayOptions) {
  const settled = await Promise.allSettled(
    GRID_OFFSETS.map(([latitudeOffset, longitudeOffset]) => {
      const latitude = coordinates.latitude + latitudeOffset
      const longitude = coordinates.longitude + longitudeOffset
      return weatherCacheService.getOrFetch({
        key: `weather-zone:${latitude.toFixed(2)}:${longitude.toFixed(2)}`,
        persistRemote: false,
        provider: 'open_meteo',
        ttlMs: WEATHER_CACHE_TTL.weatherZones,
        coordinates: { latitude, longitude },
        ...options,
        fetcher: () => fetchPoint(latitude, longitude),
      })
    }),
  )
  return settled.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []))
}

async function loadNationalGrid(options: WeatherGatewayOptions) {
  const settled = await Promise.allSettled(
    BRAZIL_GRID.map(([latitude, longitude]) =>
      weatherCacheService.getOrFetch({
        key: `weather-zone-national:${latitude.toFixed(2)}:${longitude.toFixed(2)}`,
        persistRemote: false,
        provider: 'open_meteo',
        ttlMs: WEATHER_CACHE_TTL.weatherZones,
        coordinates: { latitude, longitude },
        ...options,
        fetcher: () => fetchPoint(latitude, longitude),
      }),
    ),
  )
  return settled.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []))
}

function periodIndex(period: WeatherZonePeriod) {
  if (period === '6h') return 6
  if (period === '24h') return 23
  if (period === 'tomorrow') return 30
  return 0
}

function classifyZone(hour: ZoneHour): Pick<WeatherZone, 'kind' | 'label' | 'color' | 'radiusM'> {
  if (hour.weatherCode >= 95 || hour.gustKmh >= 55) {
    return { kind: 'storm', label: 'Zona de tempestade', color: '#d83362', radiusM: 230000 }
  }
  if (hour.precipitationMm >= 1.5 || hour.rainProbabilityPct >= 65 || hour.weatherCode >= 51) {
    return { kind: 'rain', label: 'Zona de chuva', color: '#2f73c6', radiusM: 220000 }
  }
  if (hour.temperatureC >= 30) {
    return { kind: 'heat', label: 'Zona de calor', color: '#e5a127', radiusM: 250000 }
  }
  if (hour.temperatureC <= 16) {
    return { kind: 'cold', label: 'Zona de frio', color: '#48a4d5', radiusM: 245000 }
  }
  if ([1, 2, 3, 45, 48].includes(hour.weatherCode) || hour.humidityPct >= 82) {
    return { kind: 'cloud', label: 'Zona nublada', color: '#8a9da3', radiusM: 225000 }
  }
  if (hour.humidityPct <= 32) {
    return { kind: 'dry', label: 'Zona seca', color: '#d9c52b', radiusM: 240000 }
  }
  return { kind: 'stable', label: 'Tempo estável', color: '#43a968', radiusM: 210000 }
}

function toWeatherZone(point: ZonePoint, period: WeatherZonePeriod): WeatherZone | null {
  const hour = point.hours[periodIndex(period)] ?? point.hours.at(-1)
  if (!hour) return null
  const classification = classifyZone(hour)

  return {
    id: `${point.latitude.toFixed(2)}:${point.longitude.toFixed(2)}:${period}`,
    ...classification,
    detail: `${Math.round(hour.temperatureC)}°C · ${Math.round(hour.humidityPct)}% UR · vento ${Math.round(hour.windKmh)} km/h`,
    latitude: point.latitude,
    longitude: point.longitude,
    temperatureC: hour.temperatureC,
    humidityPct: hour.humidityPct,
    precipitationMm: hour.precipitationMm,
    rainProbabilityPct: hour.rainProbabilityPct,
    weatherCode: hour.weatherCode,
    windKmh: hour.windKmh,
    gustKmh: hour.gustKmh,
    windDirectionDeg: hour.windDirectionDeg,
    forecastHours: point.hours.slice(0, 24),
  }
}

function average(values: number[]) {
  return values.reduce((total, value) => total + value, 0) / Math.max(values.length, 1)
}

function averageDirection(values: number[]) {
  const sin = average(values.map((value) => Math.sin((value * Math.PI) / 180)))
  const cos = average(values.map((value) => Math.cos((value * Math.PI) / 180)))
  return (Math.atan2(sin, cos) * 180) / Math.PI + 360
}

function distanceDegrees(a: WeatherZone, b: WeatherZone) {
  return Math.hypot(a.latitude - b.latitude, (a.longitude - b.longitude) * 0.85)
}

function groupNearbyZones(zones: WeatherZone[]) {
  const remaining = [...zones]
  const groups: WeatherZone[][] = []

  while (remaining.length > 0) {
    const group = [remaining.shift() as WeatherZone]
    let foundNearby = true
    while (foundNearby) {
      foundNearby = false
      for (let index = remaining.length - 1; index >= 0; index -= 1) {
        if (remaining[index].kind === group[0].kind && group.some((zone) => distanceDegrees(zone, remaining[index]) <= 7.5)) {
          group.push(remaining.splice(index, 1)[0])
          foundNearby = true
        }
      }
    }
    groups.push(group)
  }

  return groups
}

function mergeZoneGroup(group: WeatherZone[]) {
  const representative = group[0]
  const temperatureC = average(group.map((zone) => zone.temperatureC))
  const humidityPct = average(group.map((zone) => zone.humidityPct))
  const windKmh = average(group.map((zone) => zone.windKmh))
  const maxHours = Math.max(...group.map((zone) => zone.forecastHours.length), 0)
  const forecastHours = Array.from({ length: maxHours }, (_, index) => {
    const hours = group.flatMap((zone) => (zone.forecastHours[index] ? [zone.forecastHours[index]] : []))
    return {
      temperatureC: average(hours.map((hour) => hour.temperatureC)),
      humidityPct: average(hours.map((hour) => hour.humidityPct)),
      precipitationMm: average(hours.map((hour) => hour.precipitationMm)),
      rainProbabilityPct: average(hours.map((hour) => hour.rainProbabilityPct)),
      weatherCode: Math.round(average(hours.map((hour) => hour.weatherCode))),
      windKmh: average(hours.map((hour) => hour.windKmh)),
      gustKmh: Math.max(...hours.map((hour) => hour.gustKmh), 0),
      windDirectionDeg: averageDirection(hours.map((hour) => hour.windDirectionDeg)) % 360,
    }
  })

  return {
    ...representative,
    id: `${representative.kind}:${group.map((zone) => zone.id).join('|')}`,
    latitude: average(group.map((zone) => zone.latitude)),
    longitude: average(group.map((zone) => zone.longitude)),
    radiusM: representative.radiusM + Math.min(180000, (group.length - 1) * 50000),
    temperatureC,
    humidityPct,
    precipitationMm: average(group.map((zone) => zone.precipitationMm)),
    rainProbabilityPct: average(group.map((zone) => zone.rainProbabilityPct)),
    windKmh,
    gustKmh: Math.max(...group.map((zone) => zone.gustKmh)),
    windDirectionDeg: averageDirection(group.map((zone) => zone.windDirectionDeg)) % 360,
    forecastHours,
    detail: `${group.length} ${group.length === 1 ? 'área amostrada' : 'áreas amostradas'} · ${Math.round(temperatureC)}°C médio · vento ${Math.round(windKmh)} km/h`,
  }
}

function mergeZones(zones: WeatherZone[]) {
  return groupNearbyZones(zones).map(mergeZoneGroup)
}

function regionForZone(zone: WeatherZone) {
  if (zone.latitude <= -24) return 'south'
  if (zone.latitude <= -18 && zone.longitude >= -50) return 'southeast'
  if (zone.latitude <= -10 && zone.longitude < -50) return 'centerwest'
  if (zone.longitude >= -50) return 'northeast'
  return 'north'
}

function mergeRegionalZones(zones: WeatherZone[]) {
  const priority: Record<WeatherZoneKind, number> = {
    storm: 7,
    rain: 6,
    cold: 5,
    heat: 4,
    dry: 3,
    cloud: 2,
    stable: 1,
  }
  const regionMeta: Record<string, { latitude: number; longitude: number; label: string; radiusM: number }> = {
    north: { latitude: -4.5, longitude: -61.5, label: 'Norte', radiusM: 820000 },
    northeast: { latitude: -9.5, longitude: -39.5, label: 'Nordeste', radiusM: 620000 },
    centerwest: { latitude: -15.5, longitude: -55.5, label: 'Centro-Oeste', radiusM: 680000 },
    southeast: { latitude: -21.0, longitude: -44.0, label: 'Sudeste', radiusM: 590000 },
    south: { latitude: -29.0, longitude: -52.0, label: 'Sul', radiusM: 560000 },
  }
  const conditionLabels: Record<WeatherZoneKind, string> = {
    storm: 'Tempestade',
    rain: 'Chuva',
    cold: 'Frio',
    heat: 'Calor',
    dry: 'Tempo seco',
    cloud: 'Nublado',
    stable: 'Estável',
  }
  const grouped = new Map<string, WeatherZone[]>()
  zones.forEach((zone) => {
    const region = regionForZone(zone)
    grouped.set(region, [...(grouped.get(region) ?? []), zone])
  })

  return Array.from(grouped.entries()).map(([region, group]) => {
    const strongest = [...group].sort((a, b) => priority[b.kind] - priority[a.kind])[0]
    const meta = regionMeta[region]
    return {
      ...mergeZoneGroup(group),
      kind: strongest.kind,
      label: `${conditionLabels[strongest.kind]} · ${meta.label}`,
      color: strongest.color,
      latitude: meta.latitude,
      longitude: meta.longitude,
      radiusM: meta.radiusM,
      precipitationMm: Math.max(...group.map((zone) => zone.precipitationMm)),
      rainProbabilityPct: Math.max(...group.map((zone) => zone.rainProbabilityPct)),
    }
  })
}

export const weatherZoneService = {
  async getZones(coordinates: Coordinates, period: WeatherZonePeriod, options: WeatherGatewayOptions = {}) {
    try {
      const points = await loadGrid(coordinates, options)
      const zones = points.flatMap((point) => {
        const zone = toWeatherZone(point, period)
        return zone ? [zone] : []
      })
      return mergeZones(zones)
    } catch (error) {
      console.warn('Nao foi possivel montar zonas meteorologicas.', error)
      return []
    }
  },

  async getNationalZones(period: WeatherZonePeriod, options: WeatherGatewayOptions = {}) {
    try {
      const points = await loadNationalGrid(options)
      const zones = points.flatMap((point) => {
        const zone = toWeatherZone(point, period)
        return zone ? [zone] : []
      })
      return mergeRegionalZones(zones)
    } catch (error) {
      console.warn('Nao foi possivel montar a visao meteorologica nacional.', error)
      return []
    }
  },
}
