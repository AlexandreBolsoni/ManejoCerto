import type { MarketQuote } from '../../../types'

export type ProviderQuote = Pick<
  MarketQuote,
  | 'dataQualityLabel'
  | 'history'
  | 'historyByPeriod'
  | 'price'
  | 'quoteStatus'
  | 'quoteType'
  | 'officialSource'
  | 'sourceType'
  | 'fallbackLevel'
  | 'statusLabel'
  | 'freshnessLabel'
  | 'quotedAt'
  | 'rawPrice'
  | 'source'
  | 'sourceUrl'
  | 'trend'
  | 'unit'
  | 'updatedAt'
  | 'variationPct'
  | 'variations'
>

export type MarketQuoteProvider = {
  name: string
  getQuote: (crop: string) => Promise<ProviderQuote | null>
}
