import type { MarketHistoryPoint, MarketPeriod, MarketQuote, MarketTrend, MarketVariation } from '../types'

const COFFEE_PRICES_URL = 'https://raw.githubusercontent.com/opedromartinss/cotacoes-cafe/main/data/prices.json'
const COFFEE_HISTORY_URL = 'https://raw.githubusercontent.com/opedromartinss/cotacoes-cafe/main/data/precos.json'
const REDACAO_AGRO_URL = 'https://www.redacaoagro.com.br/api/cotacoes.php'
const COFFEE_SOURCE_URL = 'https://cotacaodocafe.com/'
const REDACAO_SOURCE_URL = 'https://www.redacaoagro.com.br/ferramentas-cotacoes.php'

type ProviderQuote = Pick<
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

type CoffeePricesResponse = {
  ultima_atualizacao?: string
  data_formatada?: string
  hora_formatada?: string
  fonte?: string
  cafe?: {
    arabica?: CoffeePriceItem
    robusta?: CoffeePriceItem
    conilon?: CoffeePriceItem
  }
}

type CoffeePriceItem = {
  preco?: number
  price?: number
  unidade?: string
  peso_kg?: number
  moeda?: string
}

type CoffeeHistoryRecord = {
  referente_a?: string
  coletado_em?: string
  produto?: string
  tipo?: string
  valor?: number
  unidade?: string
  moeda?: string
}

type RedacaoAgroCommodity = {
  nome?: string
  unidade?: string
  praca?: string
  valor?: number
  variacao?: number
  fonte?: string
  timestamp?: string
}

type RedacaoAgroResponse = {
  status?: string
  atualizacao?: string
  fonte?: string
  commodities?: Record<string, RedacaoAgroCommodity>
}

type CoffeeKind = 'arabica' | 'conilon'

const minimumPeriodCoverageDays: Record<MarketPeriod, number> = {
  annual: 90,
  monthly: 14,
  weekly: 1,
}

const redacaoCropMap: Record<string, { key: string; quoteType?: string }> = {
  algodao: { key: 'algodao', quoteType: 'Algodão em pluma' },
  'algodao-em-pluma': { key: 'algodao', quoteType: 'Algodão em pluma' },
  'cana-de-acucar': { key: 'acucar', quoteType: 'Açúcar cristal, referência para cadeia da cana' },
  milho: { key: 'milho' },
  soja: { key: 'soja' },
  trigo: { key: 'trigo' },
}

let coffeePayloadPromise: Promise<{ history: CoffeeHistoryRecord[]; prices: CoffeePricesResponse } | null> | null = null
let redacaoPayloadPromise: Promise<RedacaoAgroResponse | null> | null = null

function normalizeCrop(crop: string) {
  return crop
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\W+/g, '-')
    .replace(/^-|-$/g, '')
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', {
    currency: 'BRL',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: 'currency',
  })
}

function trendFromVariation(variationPct: number): MarketTrend {
  if (variationPct > 0.01) return 'up'
  if (variationPct < -0.01) return 'down'
  return 'flat'
}

function parseBrazilianDate(value?: string) {
  if (!value) return null
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null
  const [, day, month, year] = match
  return new Date(Number(year), Number(month) - 1, Number(day), 12)
}

function parseTimestamp(value?: string) {
  if (!value) return undefined
  const normalized = value.includes('T') ? value : value.replace(' ', 'T')
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

function formatPointLabel(date: Date) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function periodCutoff(period: MarketPeriod) {
  const now = new Date()
  const days = period === 'weekly' ? 7 : period === 'monthly' ? 30 : 365
  now.setDate(now.getDate() - days)
  return now
}

function periodLabel(period: MarketPeriod) {
  return period === 'weekly' ? 'Semana' : period === 'monthly' ? 'Mês' : 'Ano'
}

function latestDistinctDailyRecords(records: CoffeeHistoryRecord[], kind: CoffeeKind) {
  const normalizedKind = kind === 'conilon' ? ['conilon', 'conillon', 'robusta'] : ['arabica']
  const dailyMap = new Map<string, CoffeeHistoryRecord>()

  records.forEach((record) => {
    const recordKind = normalizeCrop(record.tipo ?? '')
    const value = Number(record.valor)
    if (record.produto !== 'cafe' || !normalizedKind.includes(recordKind) || !Number.isFinite(value)) return

    const date = parseBrazilianDate(record.referente_a)
    if (!date) return

    const dayKey = date.toISOString().slice(0, 10)
    const previous = dailyMap.get(dayKey)
    if (!previous || (record.coletado_em ?? '') > (previous.coletado_em ?? '')) {
      dailyMap.set(dayKey, record)
    }
  })

  return Array.from(dailyMap.values()).sort((left, right) => {
    const leftDate = parseBrazilianDate(left.referente_a)?.getTime() ?? 0
    const rightDate = parseBrazilianDate(right.referente_a)?.getTime() ?? 0
    return leftDate - rightDate
  })
}

function historyPointsFromCoffee(records: CoffeeHistoryRecord[], kind: CoffeeKind, currentValue: number, quotedAt?: string) {
  const points = latestDistinctDailyRecords(records, kind).map<MarketHistoryPoint>((record) => {
    const date = parseBrazilianDate(record.referente_a) ?? new Date(record.coletado_em ?? Date.now())
    return {
      date: date.toISOString(),
      label: formatPointLabel(date),
      value: Number(record.valor),
    }
  })

  const currentDate = quotedAt ? new Date(quotedAt) : new Date()
  const currentDayKey = currentDate.toISOString().slice(0, 10)
  const last = points[points.length - 1]

  if (last?.date.slice(0, 10) === currentDayKey) {
    last.value = currentValue
  } else {
    points.push({
      date: currentDate.toISOString(),
      label: formatPointLabel(currentDate),
      value: currentValue,
    })
  }

  return points
}

function historyByPeriod(points: MarketHistoryPoint[]): Record<MarketPeriod, MarketHistoryPoint[]> {
  return {
    annual: points.filter((point) => new Date(point.date) >= periodCutoff('annual')),
    monthly: points.filter((point) => new Date(point.date) >= periodCutoff('monthly')),
    weekly: points.filter((point) => new Date(point.date) >= periodCutoff('weekly')),
  }
}

function variationBetween(points: MarketHistoryPoint[]) {
  if (points.length < 2) return null
  const first = points[0].value
  const last = points[points.length - 1].value
  if (!first) return null
  return ((last - first) / first) * 100
}

function buildVariations(periods: Record<MarketPeriod, MarketHistoryPoint[]>) {
  const variations: MarketVariation[] = []
  const dailyVariation = variationBetween(periods.weekly.slice(-2))

  if (dailyVariation !== null) {
    variations.push({
      detail: 'último fechamento disponível',
      label: 'Dia',
      valuePct: dailyVariation,
    })
  }

  ;(['weekly', 'monthly', 'annual'] as MarketPeriod[]).forEach((period) => {
    const valuePct = variationBetween(periods[period])
    if (valuePct === null) return
    const firstDate = new Date(periods[period][0].date)
    const lastDate = new Date(periods[period][periods[period].length - 1].date)
    const coveredDays = Math.max(1, Math.round((lastDate.getTime() - firstDate.getTime()) / 86400000))
    const isPartial = coveredDays < minimumPeriodCoverageDays[period]
    variations.push({
      detail: isPartial ? `${coveredDays} dia(s) de histórico real` : undefined,
      label: isPartial ? `${periodLabel(period)} parcial` : periodLabel(period),
      valuePct,
    })
  })

  return variations
}

async function loadCoffeePayload() {
  if (!coffeePayloadPromise) {
    coffeePayloadPromise = Promise.all([
      fetch(COFFEE_PRICES_URL).then((response) => {
        if (!response.ok) throw new Error(`Cotação do café respondeu ${response.status}`)
        return response.json() as Promise<CoffeePricesResponse>
      }),
      fetch(COFFEE_HISTORY_URL).then((response) => {
        if (!response.ok) throw new Error(`Histórico do café respondeu ${response.status}`)
        return response.json() as Promise<CoffeeHistoryRecord[]>
      }),
    ])
      .then(([prices, history]) => ({ history, prices }))
      .catch(() => null)
  }

  return coffeePayloadPromise
}

async function loadRedacaoPayload() {
  if (!redacaoPayloadPromise) {
    redacaoPayloadPromise = fetch(REDACAO_AGRO_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`Redação Agro respondeu ${response.status}`)
        return response.json() as Promise<RedacaoAgroResponse>
      })
      .catch(() => null)
  }

  return redacaoPayloadPromise
}

function unitFromCoffee(item: CoffeePriceItem) {
  if (item.unidade === 'saca' && item.peso_kg) return `/sc ${item.peso_kg}kg`
  if (item.unidade) return `/${item.unidade}`
  return '/sc 60kg'
}

function priceFromCoffeeItem(item?: CoffeePriceItem) {
  const value = item?.preco ?? item?.price
  return Number.isFinite(value) ? Number(value) : null
}

async function getCoffeeQuote(crop: string): Promise<ProviderQuote | null> {
  const normalizedCrop = normalizeCrop(crop)
  const kind: CoffeeKind | null = normalizedCrop.includes('conilon') || normalizedCrop.includes('robusta') ? 'conilon' : normalizedCrop.includes('cafe') ? 'arabica' : null
  if (!kind) return null

  const payload = await loadCoffeePayload()
  if (!payload?.prices.cafe) return null

  const item = kind === 'arabica' ? payload.prices.cafe.arabica : payload.prices.cafe.conilon ?? payload.prices.cafe.robusta
  const currentValue = priceFromCoffeeItem(item)
  if (!item || currentValue === null) return null

  const quotedAt = parseTimestamp(payload.prices.ultima_atualizacao)
  const points = historyPointsFromCoffee(payload.history, kind, currentValue, quotedAt)
  const periods = historyByPeriod(points)
  const variations = buildVariations(periods)
  const variationPct = variations[0]?.valuePct ?? 0
  const history = periods.weekly.length ? periods.weekly.map((point) => point.value) : points.map((point) => point.value)

  return {
    dataQualityLabel:
      periods.monthly.length < 12
        ? 'Histórico real curto nesta fonte pública; gráficos mensal/anual ficam bloqueados até haver cobertura mínima.'
        : 'Histórico real carregado da fonte pública.',
    history,
    historyByPeriod: periods,
    price: formatCurrency(currentValue),
    quoteStatus: 'real',
    quoteType: kind === 'arabica' ? 'Café arábica CEPEA/ESALQ' : 'Café conilon/robusta CEPEA/ESALQ',
    officialSource: false,
    sourceType: 'reference_price',
    fallbackLevel: 'brasil',
    statusLabel: 'Referência pública',
    freshnessLabel: quotedAt ? 'Atualizada pela fonte conectada' : 'Atualização sem horário publicado',
    quotedAt,
    rawPrice: currentValue,
    source: `${payload.prices.fonte ?? 'Notícias Agrícolas'} via Cotação do Café`,
    sourceUrl: COFFEE_SOURCE_URL,
    trend: trendFromVariation(variationPct),
    unit: unitFromCoffee(item),
    updatedAt: quotedAt,
    variationPct,
    variations,
  }
}

async function getRedacaoQuote(crop: string): Promise<ProviderQuote | null> {
  const mapping = redacaoCropMap[normalizeCrop(crop)]
  if (!mapping) return null

  const payload = await loadRedacaoPayload()
  const commodity = payload?.commodities?.[mapping.key]
  const value = Number(commodity?.valor)
  if (!commodity || !Number.isFinite(value)) return null

  const quotedAt = parseTimestamp(commodity.timestamp ?? payload?.atualizacao)
  const variationPct = Number(commodity.variacao ?? 0)
  const pointDate = quotedAt ?? new Date().toISOString()
  const points = [
    {
      date: pointDate,
      label: new Date(pointDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      value,
    },
  ]

  return {
    dataQualityLabel: 'Cotação atual real; histórico semanal, mensal e anual ainda não disponível nesta API.',
    history: points.map((point) => point.value),
    historyByPeriod: {
      annual: points,
      monthly: points,
      weekly: points,
    },
    price: formatCurrency(value),
    quoteStatus: 'real',
    quoteType: mapping.quoteType ?? commodity.nome,
    officialSource: false,
    sourceType: 'reference_price',
    fallbackLevel: 'brasil',
    statusLabel: 'Referência pública',
    freshnessLabel: quotedAt ? 'Atualizada pela fonte conectada' : 'Atualização sem horário publicado',
    quotedAt,
    rawPrice: value,
    source: commodity.fonte ?? payload?.fonte ?? 'Redação Agro',
    sourceUrl: REDACAO_SOURCE_URL,
    trend: trendFromVariation(variationPct),
    unit: commodity.unidade ? `/${commodity.unidade}` : '/unidade',
    updatedAt: quotedAt,
    variationPct,
    variations: [
      {
        detail: commodity.praca,
        label: 'Dia',
        valuePct: variationPct,
      },
    ],
  }
}

export const marketPriceService = {
  async getQuote(crop: string) {
    return (await getCoffeeQuote(crop)) ?? (await getRedacaoQuote(crop))
  },
}
