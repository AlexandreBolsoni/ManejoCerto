import type { Farm } from '../../../types'
import { createProviderStatus, type WeatherProviderAdapter } from './types'

const BRASIL_API_BASE_URL = 'https://brasilapi.com.br/api/cptec/v1'

type BrasilApiCity = {
  nome: string
  estado: string
  id: number
}

type BrasilApiForecastDay = {
  data: string
  condicao: string
  condicao_desc: string
  min: number
  max: number
  indice_uv: number
}

type BrasilApiForecast = {
  cidade: string
  estado: string
  atualizado_em: string
  clima: BrasilApiForecastDay[]
}

export type CptecDailyForecast = {
  date: string
  condition: string
  conditionDescription: string
  minTemperatureC: number
  maxTemperatureC: number
  uvIndex: number
}

export type CptecForecast = {
  cityCode: number
  city: string
  state: string
  updatedAt: string
  days: CptecDailyForecast[]
  sourceUrl: string
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim()
}

async function fetchJson<T>(url: string) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`BrasilAPI/CPTEC respondeu ${response.status}`)
  return (await response.json()) as T
}

async function findCity(farm: Farm) {
  const cities = await fetchJson<BrasilApiCity[]>(
    `${BRASIL_API_BASE_URL}/cidade/${encodeURIComponent(farm.municipality)}`,
  )
  const municipality = normalizeText(farm.municipality)
  return (
    cities.find((city) => city.estado === farm.state && normalizeText(city.nome) === municipality) ??
    cities.find((city) => city.estado === farm.state) ??
    null
  )
}

async function getForecast(farm: Farm): Promise<CptecForecast | null> {
  try {
    const city = await findCity(farm)
    if (!city) return null

    const sourceUrl = `${BRASIL_API_BASE_URL}/clima/previsao/${city.id}/6`
    const response = await fetchJson<BrasilApiForecast>(sourceUrl)
    return {
      cityCode: city.id,
      city: response.cidade,
      state: response.estado,
      updatedAt: response.atualizado_em,
      days: response.clima.map((day) => ({
        date: day.data,
        condition: day.condicao,
        conditionDescription: day.condicao_desc,
        minTemperatureC: day.min,
        maxTemperatureC: day.max,
        uvIndex: day.indice_uv,
      })),
      sourceUrl,
    }
  } catch (error) {
    console.warn('BrasilAPI/CPTEC indisponivel. A previsao principal continua ativa.', error)
    return null
  }
}

export const cptecProvider: WeatherProviderAdapter<Farm, CptecForecast | null> = {
  id: 'brasilapi_cptec',
  role: 'validation',
  getData: getForecast,
  getStatus: () => createProviderStatus('brasilapi_cptec', 'validation'),
}
