import { describe, expect, it } from 'vitest'
import type { ForecastHour } from '../../../types'
import { calculateWeatherConfidence } from './weatherConfidenceService'

const forecastHours: ForecastHour[] = [
  {
    time: '2026-06-06T10:00:00-03:00',
    temperatureC: 25,
    humidityPct: 72,
    precipMm: 4,
    precipProbabilityPct: 80,
    windKmh: 12,
    gustKmh: 20,
    et0Mm: 0.2,
    weatherCode: 61,
  },
]

describe('calculateWeatherConfidence', () => {
  it('marca chuva com confiança alta quando Cemaden e previsão estão disponíveis', () => {
    const confidence = calculateWeatherConfidence({
      cemaden: {
        stationCode: '123',
        stationName: 'Pluviômetro Teste',
        city: 'Vitória',
        state: 'ES',
        latitude: -20.31,
        longitude: -40.31,
        observedAt: '2026-06-06T12:00:00Z',
        accumulatedMm: { hour1: 3.2 },
        sourceUrl: 'https://sws.cemaden.gov.br/',
      },
      cptec: null,
      forecastHours,
      station: null,
    })

    expect(confidence.find((item) => item.variable === 'rain')?.level).toBe('high')
  })

  it('mantém RainViewer fora do cálculo operacional', () => {
    const confidence = calculateWeatherConfidence({
      cemaden: null,
      cptec: null,
      forecastHours,
      station: null,
    })

    expect(confidence.find((item) => item.variable === 'rain')?.level).toBe('low')
    expect(confidence.flatMap((item) => item.sources)).not.toContain('rainviewer')
  })
})
