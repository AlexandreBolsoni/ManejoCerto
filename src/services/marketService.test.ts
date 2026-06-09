import { describe, expect, it } from 'vitest'
import { marketService } from './marketService'

describe('marketService.productionTypesForState', () => {
  it('separates arabica and conilon in the Espirito Santo production catalog', () => {
    const productionTypes = marketService.productionTypesForState('ES')

    expect(productionTypes).toContain('Café Arábica')
    expect(productionTypes).toContain('Café Conilon')
    expect(productionTypes).not.toContain('Café')
    expect(productionTypes).toContain('Pimenta-do-reino')
  })
})
