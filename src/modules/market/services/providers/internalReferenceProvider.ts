import type { MarketQuote } from '../../../../types'

export const internalReferenceProvider = {
  name: 'internalReferenceProvider',

  isReference(quote: MarketQuote) {
    return quote.quoteStatus === 'reference'
  },
}
