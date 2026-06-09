import { inmetService, type InmetStationObservation } from '../../../services/inmetService'
import type { Farm } from '../../../types'
import type { WeatherSnapshot } from '../types'
import { createProviderStatus, type WeatherProviderAdapter } from './types'

function normalizeObservation(observation: InmetStationObservation): WeatherSnapshot {
  return {
    source: 'inmet',
    sourcePriority: 2,
    latitude: observation.station.latitude,
    longitude: observation.station.longitude,
    timestamp: observation.observedAt,
    temperatureC: observation.temperatureC,
    humidityPct: observation.humidityPct,
    precipitationMm: observation.rainMm,
    windSpeedKmh: observation.windKmh,
    windGustKmh: observation.gustKmh,
    windDirectionDeg: observation.windDirectionDeg,
    pressureHpa: observation.pressureHpa,
    solarRadiation: observation.solarRadiationKjM2,
    confidence: observation.isFresh ? 0.9 : 0.5,
  }
}

export const inmetProvider: WeatherProviderAdapter<Farm, InmetStationObservation | null> & {
  normalizeObservation: typeof normalizeObservation
} = {
  id: 'inmet',
  role: 'validation',
  getData: (farm) => inmetService.getNearestObservation(farm),
  getStatus: () => createProviderStatus('inmet', 'validation'),
  normalizeObservation,
}
