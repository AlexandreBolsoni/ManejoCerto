import type { MarketHistoryPoint } from '../../../../types'
import type { MarketQuoteProvider } from '../../types/marketProvider.types'
import {
  buildVariations,
  formatCurrency,
  formatPointLabel,
  historyByPeriod,
  normalizeCrop,
  parseBrazilianDate,
  parseTimestamp,
  trendFromVariation,
} from '../marketProviderUtils'

const COFFEE_PRICES_URL = 'https://raw.githubusercontent.com/opedromartinss/cotacoes-cafe/main/data/prices.json'
const COFFEE_HISTORY_URL = 'https://raw.githubusercontent.com/opedromartinss/cotacoes-cafe/main/data/precos.json'
const COFFEE_SOURCE_URL = 'https://cotacaodocafe.com/'

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

type CoffeeKind = 'arabica' | 'conilon'

let coffeePayloadPromise: Promise<{ history: CoffeeHistoryRecord[]; prices: CoffeePricesResponse } | null> | null = null

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

function unitFromCoffee(item: CoffeePriceItem) {
  if (item.unidade === 'saca' && item.peso_kg) return `/sc ${item.peso_kg}kg`
  if (item.unidade) return `/${item.unidade}`
  return '/sc 60kg'
}

function priceFromCoffeeItem(item?: CoffeePriceItem) {
  const value = item?.preco ?? item?.price
  return Number.isFinite(value) ? Number(value) : null
}

export const coffeeQuoteProvider: MarketQuoteProvider = {
  name: 'coffeeQuoteProvider',

  async getQuote(crop: string) {
    const normalizedCrop = normalizeCrop(crop)
    const kind: CoffeeKind | null =
      normalizedCrop.includes('conilon') || normalizedCrop.includes('robusta')
        ? 'conilon'
        : normalizedCrop.includes('cafe')
          ? 'arabica'
          : null
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
  },
}
