import type { MarketQuoteProvider } from '../types/marketProvider.types'
import { coffeeQuoteProvider } from './providers/coffeeQuoteProvider'
import { redacaoAgroProvider } from './providers/redacaoAgroProvider'

const providers: MarketQuoteProvider[] = [coffeeQuoteProvider, redacaoAgroProvider]

export const marketGateway = {
  async getQuote(crop: string) {
    for (const provider of providers) {
      const quote = await provider.getQuote(crop)
      if (quote) return quote
    }

    return null
  },
}
