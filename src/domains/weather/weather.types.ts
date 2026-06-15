export type ClimateMetric = {
  label: string
  value: string
  detail: string
}

export type ForecastHour = {
  time: string
  temperatureC: number
  humidityPct: number
  precipMm: number
  precipProbabilityPct: number
  windKmh: number
  gustKmh: number
  windDirectionDeg?: number
  et0Mm: number
  weatherCode: number
}

export type WeatherSnapshot = {
  fieldName: string
  crop: string
  stage: string
  location: string
  updatedAtLabel: string
  current: {
    temperatureC: number
    description: string
    feelsLikeC: number
    rainNext6h: string
    wind: string
    humidity: string
    minMax: string
  }
  et0: {
    valueMm: number
    description: string
    bars: number[]
  }
  irrigationWindow: {
    title: string
    description: string
    progressPct: number
  }
  sources: {
    name: string
    value: string
    detail: string
  }[]
  forecastHours?: ForecastHour[]
}
