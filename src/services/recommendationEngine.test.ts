import { describe, expect, it } from 'vitest'
import { demoFields, demoWeather } from '../lib/mockData'
import { generateRecommendations } from './recommendationEngine'

describe('generateRecommendations', () => {
  it('creates explainable recommendations with confidence and sources', () => {
    const recommendations = generateRecommendations(demoFields, demoWeather)

    expect(recommendations[0]?.title).toContain('Adiar irrigação')
    expect(recommendations[0]?.confidence).toBeGreaterThan(80)
    expect(recommendations[0]?.sources).toContain('INMET')
    expect(recommendations[0]?.sources).not.toContain('Radar')
  })
})
