import { describe, expect, it } from 'vitest'
import type { Farm, Field } from '../../../types'
import { resolveWeatherLocation } from './weatherLocationService'

const farm: Farm = {
  id: 'farm-1',
  name: 'Fazenda NimbuES',
  municipality: 'Vitória',
  state: 'ES',
  locationLabel: 'Vitória, ES',
  productionType: 'Café conilon',
  areaHa: 80,
  timezone: 'America/Sao_Paulo',
  coordinates: { latitude: -20.31, longitude: -40.31 },
}

const field: Field = {
  id: 'field-1',
  name: 'Talhão Norte',
  crop: 'Café conilon',
  areaHa: 12,
  stage: 'produção',
  soilType: 'argiloso',
  irrigation: 'monitorar',
  climateStatus: 'estável',
  currentRecommendation: 'monitorar',
  riskLevel: 'baixo',
  lastUpdate: 'agora',
  sensitivities: [],
}

describe('weatherLocationService', () => {
  it('usa coordenada própria do talhão quando disponível', () => {
    const result = resolveWeatherLocation({
      activeFieldId: field.id,
      farm,
      fields: [{ ...field, coordinates: { latitude: -20.4, longitude: -40.4 } }],
    })

    expect(result?.source).toBe('field')
    expect(result?.coordinates.latitude).toBe(-20.4)
    expect(result?.inheritedFromFarm).toBeUndefined()
  })

  it('faz talhão sem GPS herdar o centro da fazenda', () => {
    const result = resolveWeatherLocation({ activeFieldId: field.id, farm, fields: [field] })

    expect(result?.source).toBe('field')
    expect(result?.coordinates).toEqual(farm.coordinates)
    expect(result?.inheritedFromFarm).toBe(true)
  })

  it('bloqueia localização climática quando a fazenda não possui coordenadas', () => {
    const result = resolveWeatherLocation({ farm: { ...farm, coordinates: undefined }, fields: [] })
    expect(result).toBeNull()
  })
})
