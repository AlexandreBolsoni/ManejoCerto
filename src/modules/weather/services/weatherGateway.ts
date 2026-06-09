import type { Coordinates, Farm } from '../../../types'
import { cemadenProvider } from '../providers/cemadenProvider'
import { cptecProvider } from '../providers/cptecProvider'
import { inmetProvider } from '../providers/inmetProvider'
import { openMeteoProvider } from '../providers/openMeteoProvider'
import { rainViewerProvider } from '../providers/rainViewerProvider'
import { WEATHER_CACHE_TTL, weatherCacheService } from './weatherCacheService'

export type WeatherGatewayOptions = {
  userId?: string
  farmId?: string
  fieldId?: string
  forceRefresh?: boolean
}

function locationKey(coordinates: Coordinates) {
  return `${coordinates.latitude.toFixed(3)}:${coordinates.longitude.toFixed(3)}`
}

export const weatherGateway = {
  getForecastByLocation(coordinates: Coordinates, options: WeatherGatewayOptions = {}) {
    return weatherCacheService.getOrFetch({
      key: `forecast-hourly:${locationKey(coordinates)}`,
      provider: 'open_meteo',
      ttlMs: WEATHER_CACHE_TTL.forecastHourly,
      coordinates,
      ...options,
      fetcher: () => openMeteoProvider.getData(coordinates),
    })
  },

  getNearestOfficialObservation(farm: Farm, options: WeatherGatewayOptions = {}) {
    return weatherCacheService.getOrFetch({
      key: `inmet-nearest:${farm.municipalityId ?? `${farm.state}:${farm.municipality}`}`,
      provider: 'inmet',
      ttlMs: WEATHER_CACHE_TTL.officialObservation,
      farmId: farm.id,
      ...options,
      fetcher: () => inmetProvider.getData(farm),
    })
  },

  getBrazilianForecast(farm: Farm, options: WeatherGatewayOptions = {}) {
    return weatherCacheService.getOrFetch({
      key: `cptec-daily:${farm.municipalityId ?? `${farm.state}:${farm.municipality}`}`,
      provider: 'brasilapi_cptec',
      ttlMs: WEATHER_CACHE_TTL.forecastDaily,
      farmId: farm.id,
      ...options,
      fetcher: () => cptecProvider.getData(farm),
    })
  },

  getNearestRainGauge(farm: Farm, options: WeatherGatewayOptions = {}) {
    return weatherCacheService.getOrFetch({
      key: `cemaden-nearest:${farm.municipalityId ?? `${farm.state}:${farm.municipality}`}`,
      provider: 'cemaden',
      ttlMs: WEATHER_CACHE_TTL.rainGauge,
      coordinates: farm.coordinates,
      farmId: farm.id,
      ...options,
      fetcher: () => cemadenProvider.getData(farm),
    })
  },

  getVisualRadarMetadata(options: WeatherGatewayOptions = {}) {
    return weatherCacheService.getOrFetch({
      key: 'rainviewer-metadata',
      persistRemote: false,
      provider: 'rainviewer',
      ttlMs: WEATHER_CACHE_TTL.radarMetadata,
      ...options,
      fetcher: () => rainViewerProvider.getData(),
    })
  },

  getProviderStatuses() {
    return [
      openMeteoProvider.getStatus(),
      inmetProvider.getStatus(),
      cptecProvider.getStatus(),
      cemadenProvider.getStatus(),
      rainViewerProvider.getStatus(),
    ]
  },
}
