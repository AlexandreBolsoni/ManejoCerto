import { APP_STATE_NAME } from '../../../config/brand'
import { marketService } from '../../../services/marketService'
import type { ForecastHour, MarketHistoryPoint, MarketPeriod, MarketQuote } from '../../../types'
import type { MarketFilter } from '../types/marketPage.types'

export const cropIcons: Record<string, string> = {
  Banana: '🌿',
  Cacau: '🫘',
  'Café Arábica': '☕',
  'Café Conilon': '☕',
  Gengibre: '🫚',
  Mamão: '🍈',
  'Pimenta-do-reino': '🌶',
}

export function normalizeCrop(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\W+/g, '-')
    .replace(/^-|-$/g, '')
}

export function sameCrop(left: string, right: string) {
  return normalizeCrop(left) === normalizeCrop(right)
}

function quoteMatchesAnyCrop(quote: MarketQuote, crops: string[]) {
  return crops.some((crop) => sameCrop(quote.crop, crop))
}

export function filterQuotes(quotes: MarketQuote[], filter: MarketFilter, userCrops: string[]) {
  if (filter === 'mine') return userCrops.length > 0 ? quotes.filter((quote) => quoteMatchesAnyCrop(quote, userCrops)) : []
  if (filter === 'coffee') return quotes.filter((quote) => quoteMatchesCategory(quote, ['cafe']))
  if (filter === 'fruits') return quotes.filter((quote) => quoteMatchesCategory(quote, ['fruticultura', 'citricultura', 'fruta', 'banana', 'mamao', 'cacau', 'laranja', 'maca', 'uva', 'manga', 'goiaba', 'morango', 'abacaxi', 'maracuja', 'coco']))
  if (filter === 'vegetables') return quotes.filter((quote) => quoteMatchesCategory(quote, ['olericultura', 'hortifruti', 'hortalicas', 'tomate', 'alface', 'repolho']))
  if (filter === 'grains') return quotes.filter((quote) => quoteMatchesCategory(quote, ['graos', 'graos-alimentares', 'soja', 'milho', 'trigo', 'arroz', 'feijao', 'sorgo']))
  return quotes
}

function quoteMatchesCategory(quote: MarketQuote, keys: string[]) {
  const crop = normalizeCrop(quote.crop)
  const category = normalizeCrop(quote.category ?? '')
  return keys.some((key) => crop.includes(key) || category.includes(key))
}

export function toneForQuote(quote: MarketQuote) {
  if (quote.quoteStatus === 'reference') return 'amber'
  if (quote.quoteStatus !== 'real') return 'soft'
  if (quote.trend === 'up') return 'green'
  if (quote.trend === 'down') return 'red'
  return 'soft'
}

export function isPricedQuote(quote: MarketQuote) {
  return quote.quoteStatus === 'real' || quote.quoteStatus === 'reference'
}

export function formatVariation(value: number) {
  if (Math.abs(value) < 0.01) return '0,00%'
  return `${value > 0 ? '+' : ''}${value.toLocaleString('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}%`
}

export function formatQuoteDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function coverageDays(points: MarketHistoryPoint[]) {
  const first = new Date(points[0]?.date ?? '')
  const last = new Date(points[points.length - 1]?.date ?? '')
  if (Number.isNaN(first.getTime()) || Number.isNaN(last.getTime())) return Math.max(points.length - 1, 0)
  return Math.max(0, Math.round((last.getTime() - first.getTime()) / 86400000))
}

export function hasUsableSeries(points: MarketHistoryPoint[], period: MarketPeriod) {
  const minimum = period === 'weekly' ? 1 : period === 'monthly' ? 14 : 90
  return points.length >= 2 && coverageDays(points) >= minimum
}

export function marketInsights(quote: MarketQuote, period: MarketPeriod) {
  const seriesOk = hasUsableSeries(quote.historyByPeriod?.[period] ?? [], period)
  return [
    quote.trend === 'flat' ? 'Mercado estável na última leitura.' : `Mercado em ${quote.trend === 'up' ? 'alta' : 'queda'} na última leitura.`,
    seriesOk ? 'Histórico real suficiente para gráfico no período.' : 'Histórico insuficiente para gráfico real neste período.',
    quote.quoteStatus === 'reference' ? 'Estimativa interna aparece apenas como referência de card.' : 'Cotação atual veio de fonte conectada.',
  ]
}

export function marketClimateRows(hours: ForecastHour[] = []) {
  const next7Days = hours.slice(0, 24 * 7)
  const rain = next7Days.reduce((total, hour) => total + hour.precipMm, 0)
  const wind = Math.max(...next7Days.map((hour) => hour.gustKmh), 0)
  const humidity = next7Days.length ? next7Days.reduce((total, hour) => total + hour.humidityPct, 0) / next7Days.length : 0

  return [
    { label: 'Chuva (7 dias)', value: `${rain.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mm` },
    { label: 'Vento', value: wind >= 30 ? 'Atenção' : 'Regular' },
    { label: 'Umidade', value: humidity >= 82 ? 'Alta' : 'Controlada' },
  ]
}

export function quoteStatusLine(quote: MarketQuote) {
  if (quote.quoteStatus !== 'real' && quote.quoteStatus !== 'reference') return 'sem preço'
  const icon = quote.trend === 'up' ? '▲' : quote.trend === 'down' ? '▼' : '●'
  return `${icon} ${formatVariation(quote.variationPct)}`
}

export function compactSourceName(source?: string) {
  if (!source) return 'Fonte pendente'
  return source.replace('Referência NimbuES v0 · ', 'Manejo Certo · ')
}

export function primaryDataQualityLabel(quote: MarketQuote, period: MarketPeriod) {
  if (quote.quoteStatus === 'reference') return 'Estimativa interna'
  if (hasUsableSeries(quote.historyByPeriod?.[period] ?? [], period)) return 'Histórico real'
  if (quote.quoteStatus === 'real') return 'Cotação atual'
  return 'Dados insuficientes'
}

export function dataQualityTone(quote: MarketQuote, period: MarketPeriod) {
  if (quote.quoteStatus === 'reference') return 'estimated'
  if (hasUsableSeries(quote.historyByPeriod?.[period] ?? [], period)) return 'real'
  if (quote.quoteStatus === 'real') return 'partial'
  return 'insufficient'
}

export function dataQualityLabels(quote: MarketQuote, period: MarketPeriod) {
  const labels = [
    {
      text: marketService.quoteStatusLabel(quote),
      tone: quote.quoteStatus === 'real' ? 'real' : quote.quoteStatus === 'reference' ? 'estimated' : 'insufficient',
    },
  ]

  labels.push({
    text: hasUsableSeries(quote.historyByPeriod?.[period] ?? [], period) ? 'Histórico real' : 'Dados insuficientes',
    tone: hasUsableSeries(quote.historyByPeriod?.[period] ?? [], period) ? 'real' : 'insufficient',
  })

  if (quote.quoteStatus === 'reference') labels.push({ text: 'Não entra no gráfico', tone: 'estimated' })

  return labels
}

export function indexedTrendForQuote(quote: MarketQuote, period: MarketPeriod) {
  const points = quote.historyByPeriod?.[period] ?? []
  if (!hasUsableSeries(points, period)) return null

  const first = points[0].value
  const last = points[points.length - 1].value
  if (!first) return null

  const to = Number(((last / first) * 100).toFixed(2))
  return { changePct: to - 100, to }
}

export function indexBarWidth(index: number) {
  return Math.max(8, Math.min(100, (index / 120) * 100))
}

export function marketAdvancedCards(quote: MarketQuote) {
  const isCoffee = normalizeCrop(quote.crop).includes('cafe')

  return [
    {
      title: 'Dólar PTAX',
      status: 'Planejado',
      body: 'Entrada futura para acompanhar câmbio de referência quando a cultura tiver exposição a exportação.',
    },
    {
      title: 'B3 / mercado futuro',
      status: isCoffee ? 'Relevante' : 'Avançado',
      body: isCoffee ? 'Pode entrar como contexto para café arábica e conilon/robusta, separado da cotação física do produtor.' : 'Disponível apenas para culturas com contrato ou indicador compatível.',
    },
    {
      title: 'Produção municipal',
      status: APP_STATE_NAME,
      body: 'Camada planejada para cruzar preço com IBGE PAM, município e peso produtivo regional.',
    },
    {
      title: 'Exportação',
      status: 'Futuro',
      body: 'Contexto adicional para culturas exportadoras, sem interferir no preço de hoje da tela inicial.',
    },
  ]
}
