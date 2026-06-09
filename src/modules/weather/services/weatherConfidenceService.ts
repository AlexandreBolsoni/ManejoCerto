import type { InmetStationObservation } from '../../../services/inmetService'
import type { ForecastHour } from '../../../types'
import type { CemadenRainGauge } from '../providers/cemadenProvider'
import type { CptecForecast } from '../providers/cptecProvider'
import type { WeatherConfidence, WeatherProvider } from '../types'

type ConfidenceInput = {
  cemaden: CemadenRainGauge | null
  cptec: CptecForecast | null
  forecastHours: ForecastHour[]
  station: InmetStationObservation | null
}

function uniqueSources(sources: WeatherProvider[]) {
  return [...new Set(sources)]
}

function result(
  variable: WeatherConfidence['variable'],
  level: WeatherConfidence['level'],
  reasons: string[],
  sources: WeatherProvider[],
): WeatherConfidence {
  return {
    variable,
    level,
    reasons,
    sources: uniqueSources(sources),
    updatedAt: new Date().toISOString(),
  }
}

function rainConfidence({ cemaden, forecastHours, station }: ConfidenceInput) {
  const forecastRain24h = forecastHours.slice(0, 24).reduce((sum, hour) => sum + hour.precipMm, 0)
  const hasForecast = forecastHours.length > 0
  const hasCemaden = Boolean(cemaden)
  const hasFreshInmetRain = Boolean(station?.isFresh && station.rainMm !== undefined)

  if (hasCemaden && hasForecast) {
    return result(
      'rain',
      'high',
      [`Cemaden observado e Open-Meteo comparados; previsão de ${forecastRain24h.toFixed(1)} mm em 24h.`],
      ['cemaden', 'open_meteo'],
    )
  }
  if (hasFreshInmetRain && hasForecast) {
    return result('rain', 'high', ['Observação INMET recente comparada com a previsão horária.'], ['inmet', 'open_meteo'])
  }
  if (hasCemaden || hasFreshInmetRain) {
    return result('rain', 'medium', ['Há observação recente, mas falta uma segunda fonte para comparação.'], hasCemaden ? ['cemaden'] : ['inmet'])
  }
  if (hasForecast) {
    return result('rain', 'low', ['Chuva baseada somente em previsão; confirme visualmente e com medição local.'], ['open_meteo'])
  }
  return result('rain', 'unavailable', ['Sem previsão ou observação de chuva disponível.'], [])
}

function windConfidence({ forecastHours, station }: ConfidenceInput) {
  const forecast = forecastHours[0]
  if (station?.isFresh && station.windKmh !== undefined && forecast) {
    const difference = Math.abs(station.windKmh - forecast.windKmh)
    return result(
      'wind',
      difference <= 12 ? 'high' : 'medium',
      [difference <= 12 ? 'INMET e Open-Meteo apresentam vento próximo.' : 'INMET e previsão divergem; use cautela operacional.'],
      ['inmet', 'open_meteo'],
    )
  }
  if (forecast) return result('wind', 'medium', ['Vento disponível na previsão horária, sem observação INMET recente.'], ['open_meteo'])
  return result('wind', 'unavailable', ['Sem dados de vento disponíveis.'], [])
}

function temperatureConfidence({ cptec, forecastHours, station }: ConfidenceInput) {
  const forecast = forecastHours[0]
  if (station?.isFresh && station.temperatureC !== undefined && forecast) {
    const difference = Math.abs(station.temperatureC - forecast.temperatureC)
    return result(
      'temperature',
      difference <= 4 ? 'high' : 'medium',
      [difference <= 4 ? 'INMET e Open-Meteo apresentam temperatura próxima.' : 'Temperatura observada diverge da previsão atual.'],
      ['inmet', 'open_meteo'],
    )
  }
  if (cptec && forecast) {
    return result('temperature', 'medium', ['Open-Meteo comparado com a previsão diária brasileira CPTEC.'], ['open_meteo', 'brasilapi_cptec'])
  }
  if (forecast) return result('temperature', 'medium', ['Temperatura baseada somente na previsão horária.'], ['open_meteo'])
  return result('temperature', 'unavailable', ['Sem dados de temperatura disponíveis.'], [])
}

export function calculateWeatherConfidence(input: ConfidenceInput): WeatherConfidence[] {
  return [rainConfidence(input), windConfidence(input), temperatureConfidence(input)]
}
