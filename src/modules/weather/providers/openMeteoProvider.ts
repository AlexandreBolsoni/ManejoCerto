import type { Coordinates } from '../../../types'
import type { WeatherSnapshot } from '../types'
import { createProviderStatus, type WeatherProviderAdapter } from './types'

export type OpenMeteoResponse = {
  latitude?: number
  longitude?: number
  current?: {
    time: string
    temperature_2m: number
    relative_humidity_2m: number
    precipitation: number
    weather_code: number
    wind_speed_10m: number
    wind_gusts_10m: number
    wind_direction_10m?: number
    pressure_msl?: number
  }
  hourly?: {
    time: string[]
    temperature_2m: number[]
    relative_humidity_2m: number[]
    precipitation: number[]
    precipitation_probability: number[]
    wind_speed_10m: number[]
    wind_gusts_10m: number[]
    wind_direction_10m?: number[]
    pressure_msl?: number[]
    et0_fao_evapotranspiration: number[]
    weather_code: number[]
  }
  daily?: {
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_sum: number[]
    et0_fao_evapotranspiration: number[]
  }
}

async function getForecast(coordinates: Coordinates) {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', coordinates.latitude.toFixed(5))
  url.searchParams.set('longitude', coordinates.longitude.toFixed(5))
  url.searchParams.set(
    'current',
    'temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,wind_direction_10m,pressure_msl',
  )
  url.searchParams.set(
    'hourly',
    'temperature_2m,relative_humidity_2m,precipitation,precipitation_probability,wind_speed_10m,wind_gusts_10m,wind_direction_10m,pressure_msl,et0_fao_evapotranspiration,weather_code',
  )
  url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_sum,et0_fao_evapotranspiration')
  url.searchParams.set('forecast_days', '7')
  url.searchParams.set('timezone', 'auto')

  const response = await fetch(url)
  if (!response.ok) throw new Error(`Open-Meteo respondeu ${response.status}`)
  return (await response.json()) as OpenMeteoResponse
}

function normalizeCurrent(data: OpenMeteoResponse, coordinates: Coordinates): WeatherSnapshot {
  return {
    source: 'open_meteo',
    sourcePriority: 1,
    latitude: data.latitude ?? coordinates.latitude,
    longitude: data.longitude ?? coordinates.longitude,
    timestamp: data.current?.time ?? new Date().toISOString(),
    temperatureC: data.current?.temperature_2m,
    humidityPct: data.current?.relative_humidity_2m,
    precipitationMm: data.current?.precipitation,
    windSpeedKmh: data.current?.wind_speed_10m,
    windGustKmh: data.current?.wind_gusts_10m,
    windDirectionDeg: data.current?.wind_direction_10m,
    pressureHpa: data.current?.pressure_msl,
    confidence: 0.7,
  }
}

export const openMeteoProvider: WeatherProviderAdapter<Coordinates, OpenMeteoResponse> & {
  normalizeCurrent: typeof normalizeCurrent
} = {
  id: 'open_meteo',
  role: 'operational',
  getData: getForecast,
  getStatus: () => createProviderStatus('open_meteo', 'operational'),
  normalizeCurrent,
}
