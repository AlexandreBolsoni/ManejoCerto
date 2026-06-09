import type { WeatherZoneKind } from '../services/weatherZoneService'

export type WeatherRiskLevel = 'low' | 'moderate' | 'high'
export type RainIntensity = 'none' | 'light' | 'moderate' | 'heavy' | 'storm'
export type WeatherCondition = 'sunny' | 'cloudy' | 'rain' | 'storm' | 'fog' | 'frost'
export type WeatherStatus = 'stable' | 'attention' | 'unstable' | 'alert' | 'critical'
export type SprayingStatus = 'recommended' | 'attention' | 'not_recommended'
export type IrrigationStatus = 'high_need' | 'moderate_need' | 'low_need' | 'not_needed'
export type WeatherIconType = 'sun' | 'cloud' | 'rain' | 'storm' | 'frost' | 'wind'
export type WeatherRegion = 'north' | 'northeast' | 'centerwest' | 'southeast' | 'south'

export type RadarWeatherZoneHour = {
  temperatureC: number
  humidityPct: number
  precipitationMm: number
  rainProbabilityPct: number
  weatherCode: number
  windKmh: number
  gustKmh: number
  windDirectionDeg: number
}

export type RadarWeatherZone = {
  id: string
  region: WeatherRegion
  type: WeatherZoneKind
  label: string
  detail: string
  latitude: number
  longitude: number
  radiusM: number
  color: string
  intensity: WeatherRiskLevel
  temperatureC: number
  humidityPct: number
  precipitationMm: number
  weatherCode: number
  windKmh: number
  gustKmh: number
  windDirectionDeg: number
  rainProbabilityPct: number
  forecastHours: RadarWeatherZoneHour[]
}

export type RadarWeatherData = {
  farm: {
    id: string
    name: string
    latitude: number
    longitude: number
    city?: string
    state?: string
  }
  updatedAt: string
  current: {
    temperature: number
    feelsLike: number
    humidity: number
    windSpeed: number
    windGust: number
    windDirection: string
    rainChance: number
    rainNext3h: number
    rainIntensity: RainIntensity
    condition: WeatherCondition
    description: string
  }
  status: {
    level: WeatherStatus
    label: string
    detail: string
  }
  risks: {
    storm: WeatherRiskLevel
    frost: WeatherRiskLevel
    fire: WeatherRiskLevel
    heavyRain: WeatherRiskLevel
  }
  recommendations: {
    spraying: {
      status: SprayingStatus
      reason: string
    }
    irrigation: {
      status: IrrigationStatus
      reason: string
    }
  }
  alerts: Array<{
    id: string
    title: string
    message: string
    level: WeatherRiskLevel
    timeLabel: string
  }>
  interpretation: {
    title: string
    summary: string
    recommendation: string
  }
  mapLayers: {
    rainTileUrl?: string
    rainFrames?: Array<{
      time: number
      type: 'past' | 'nowcast'
      tileUrl: string
    }>
    zones: RadarWeatherZone[]
  }
  tvMap: {
    icons: Array<{
      id: string
      type: WeatherIconType
      region: WeatherRegion
      label: string
      detail: string
    }>
    zones: RadarWeatherZone[]
    arrows: Array<{
      id: string
      type: 'wind' | 'front' | 'system'
      path: string
    }>
  }
}
