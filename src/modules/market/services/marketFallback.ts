import type { MarketQuote } from '../../../types'

export function isFallbackMarketQuote(quote: MarketQuote) {
  return quote.quoteStatus === 'reference' || quote.fallbackLevel === 'uf' || quote.fallbackLevel === 'brasil'
}

export function hasRealMarketSeries(quote: MarketQuote) {
  return Object.values(quote.historyByPeriod ?? {}).some((points) => points.length >= 2)
}
