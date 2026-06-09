import { describe, expect, it } from 'vitest'
import { demoFarm, demoWeather } from '../../lib/mockData'
import type { ForecastHour } from '../../types'
import type { ClimateDashboard } from '../climateService'
import { mapClimateToRadarWeather } from './weatherMapper'

function hour(overrides: Partial<ForecastHour> = {}): ForecastHour {
  return {
    et0Mm: 0.2,
    gustKmh: 12,
    humidityPct: 65,
    precipMm: 0,
    precipProbabilityPct: 0,
    temperatureC: 25,
    time: new Date().toISOString(),
    weatherCode: 0,
    windDirectionDeg: 135,
    windKmh: 8,
    ...overrides,
  }
}

function dashboard(hours: ForecastHour[], et0 = 3): ClimateDashboard {
  return {
    alerts: [],
    brazilianForecast: null,
    confidence: [],
    coordinates: demoFarm.coordinates!,
    generatedAt: new Date().toISOString(),
    rainGauge: null,
    realTime: true,
    recommendations: [],
    sourceStatus: {
      brazilianForecast: '',
      feedback: '',
      forecast: '',
      radar: '',
      rainGauge: '',
      station: '',
    },
    station: null,
    weather: {
      ...demoWeather,
      current: {
        ...demoWeather.current,
        temperatureC: hours[0]?.temperatureC ?? 25,
      },
      et0: {
        ...demoWeather.et0,
        valueMm: et0,
      },
      forecastHours: hours,
    },
  }
}

describe('weatherMapper', () => {
  it('bloqueia pulverização e irrigação quando há tempestade e chuva forte', () => {
    const hours = Array.from({ length: 24 }, () =>
      hour({
        gustKmh: 48,
        humidityPct: 90,
        precipMm: 3,
        precipProbabilityPct: 92,
        weatherCode: 95,
        windKmh: 22,
      }),
    )

    const result = mapClimateToRadarWeather({ climate: dashboard(hours), farm: demoFarm, zones: [] })

    expect(result.status.level).toBe('critical')
    expect(result.current.rainIntensity).toBe('storm')
    expect(result.recommendations.spraying.status).toBe('not_recommended')
    expect(result.recommendations.irrigation.status).toBe('not_needed')
  })

  it('indica alta necessidade de irrigação e traduz a direção do vento', () => {
    const hours = Array.from({ length: 24 }, () => hour({ humidityPct: 18, windDirectionDeg: 225 }))

    const result = mapClimateToRadarWeather({ climate: dashboard(hours, 5.2), farm: demoFarm, zones: [] })

    expect(result.current.windDirection).toBe('Sudoeste')
    expect(result.risks.fire).toBe('high')
    expect(result.recommendations.irrigation.status).toBe('high_need')
  })
})
