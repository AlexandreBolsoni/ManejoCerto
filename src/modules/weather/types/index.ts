export type WeatherProvider =
  | 'open_meteo'
  | 'inmet'
  | 'cptec_inpe'
  | 'brasilapi_cptec'
  | 'rainviewer'
  | 'cemaden'
  | 'inpe_queimadas'
  | 'redemet'
  | 'ana_hidroweb'
  | 'embrapa_climapi'
  | 'censipam'

export type WeatherConfidenceLevel = 'high' | 'medium' | 'low' | 'unavailable'

export type WeatherSnapshot = {
  source: WeatherProvider
  sourcePriority: number
  latitude: number
  longitude: number
  timestamp: string
  temperatureC?: number
  humidityPct?: number
  precipitationMm?: number
  precipitationProbabilityPct?: number
  windSpeedKmh?: number
  windGustKmh?: number
  windDirectionDeg?: number
  pressureHpa?: number
  solarRadiation?: number
  etoMm?: number
  fireRisk?: 'low' | 'medium' | 'high' | 'extreme'
  confidence: number
}

export type WeatherConfidence = {
  variable: 'rain' | 'wind' | 'temperature' | 'fire' | 'frost'
  level: WeatherConfidenceLevel
  reasons: string[]
  sources: WeatherProvider[]
  updatedAt: string
}

export type WeatherProviderStatus = {
  provider: WeatherProvider
  status: 'online' | 'degraded' | 'offline' | 'not_configured'
  lastSuccessAt?: string
  lastErrorAt?: string
  errorMessage?: string
  averageLatencyMs?: number
}

export type WeatherLayerRole = 'operational' | 'validation' | 'visual'
