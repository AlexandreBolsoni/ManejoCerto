export type Severity = 'critico' | 'alto' | 'moderado' | 'baixo'

export type RecommendationKind = 'irrigacao' | 'pulverizacao' | 'clima' | 'mercado'

export type SourceStatus = 'fresh' | 'stale' | 'partial' | 'offline'

export type Coordinates = {
  latitude: number
  longitude: number
  accuracyM?: number
  altitudeM?: number | null
  source?: 'usuario' | 'fazenda' | 'manual' | 'radar' | 'rede' | 'ibge'
  updatedAt?: string
}

export type UserProfile = {
  id: string
  name: string
  email: string
  initials: string
  farmName: string
}

export type Farm = {
  id: string
  name: string
  locality?: string
  localityKind?: 'municipio' | 'distrito' | 'subdistrito' | 'povoado'
  municipality: string
  municipalityId?: number
  state: string
  locationLabel: string
  productionType: string
  areaHa: number
  timezone: string
  coordinates?: Coordinates
  notes?: string
}

export type Field = {
  id: string
  name: string
  crop: string
  areaHa: number
  stage: string
  soilType: string
  irrigation: string
  climateStatus: string
  currentRecommendation: string
  riskLevel: Severity
  lastUpdate: string
  rainGaugeMm?: number
  sensitivities: string[]
  coordinates?: Coordinates
  notes?: string
}

export type ClimateMetric = {
  label: string
  value: string
  detail: string
}

export type ForecastHour = {
  time: string
  temperatureC: number
  humidityPct: number
  precipMm: number
  precipProbabilityPct: number
  windKmh: number
  gustKmh: number
  windDirectionDeg?: number
  et0Mm: number
  weatherCode: number
}

export type WeatherSnapshot = {
  fieldName: string
  crop: string
  stage: string
  location: string
  updatedAtLabel: string
  current: {
    temperatureC: number
    description: string
    feelsLikeC: number
    rainNext6h: string
    wind: string
    humidity: string
    minMax: string
  }
  et0: {
    valueMm: number
    description: string
    bars: number[]
  }
  irrigationWindow: {
    title: string
    description: string
    progressPct: number
  }
  sources: {
    name: string
    value: string
    detail: string
  }[]
  forecastHours?: ForecastHour[]
}

export type Recommendation = {
  id: string
  kind: RecommendationKind
  title: string
  description: string
  action: string
  justification: string
  confidence: number
  sources: string[]
  severity: Severity
  fieldId: string
  fieldName: string
  updatedAt: string
}

export type Alert = {
  id: string
  type: 'geada' | 'chuva severa' | 'vento forte' | 'baixa umidade' | 'risco de incendio' | 'excesso de chuva' | 'estiagem' | 'pulverizacao'
  severity: Severity
  title: string
  message: string
  fieldId: string
  fieldName: string
  timeLabel: string
  archived?: boolean
  muted?: boolean
}

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

export type Feedback = {
  id: string
  fieldId: string
  rained: boolean | null
  rainMm: number
  frost: boolean
  forecastWasRight: boolean | null
  recommendationWasUseful: boolean | null
  notes: string
  createdAt: string
  status: 'queued' | 'synced'
}

export type UserSettings = {
  metricSystem: boolean
  twentyFourHour: boolean
  pushNotifications: boolean
  offlineMode: boolean
  severeWeatherAlerts: boolean
  dailySummary: boolean
  marketReferencePrices: boolean
  marketWatchlistOnly: boolean
  autoLocationRefresh: boolean
  dataSaverMode: boolean
}
