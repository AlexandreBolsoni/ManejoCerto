export type MarketPeriod = 'weekly' | 'monthly' | 'annual'

export type MarketTrend = 'up' | 'down' | 'flat'

export type MarketSourceType =
  | 'production'
  | 'farmgate_price'
  | 'wholesale_price'
  | 'reference_price'
  | 'economic_weight'
  | 'geo_reference'
  | 'bulletin'
  | 'advisory_only'

export type MarketFallbackLevel = 'municipality' | 'uf' | 'wholesale' | 'macroregion' | 'brasil' | 'unavailable'

export type MarketVariation = {
  label: string
  valuePct: number
  detail?: string
}

export type MarketHistoryPoint = {
  date: string
  label: string
  value: number
}

export type MarketQuote = {
  id: string
  crop: string
  region: string
  price: string
  rawPrice?: number
  unit: string
  variationPct: number
  trend: MarketTrend
  history: number[]
  historyByPeriod?: Record<MarketPeriod, MarketHistoryPoint[]>
  source?: string
  sourceUrl?: string
  sourceType?: MarketSourceType
  fallbackLevel?: MarketFallbackLevel
  quotedAt?: string
  quoteStatus?: 'real' | 'reference' | 'unavailable'
  quoteType?: string
  officialSource?: boolean
  statusLabel?: string
  freshnessLabel?: string
  dataQualityLabel?: string
  variations?: MarketVariation[]
  updatedAt?: string
  volumeLabel?: string
  basisLabel?: string
  category?: string
  priority?: number
  relevanceLabel?: string
  stateShareLabel?: string
  whyMonitor?: string
}

export type StateMarketProduct = {
  crop: string
  category: string
  relevanceLabel: string
  stateShareLabel?: string
  whyMonitor: string
  priority: number
  regions?: string[]
}

export type StateMarketProfile = {
  state: string
  stateName: string
  title: string
  summary: string
  highlights: string[]
  products: StateMarketProduct[]
  sources: string[]
}
