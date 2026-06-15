import type { MarketHistoryPoint, MarketPeriod, MarketTrend, MarketVariation } from '../../../types'

const minimumPeriodCoverageDays: Record<MarketPeriod, number> = {
  annual: 90,
  monthly: 14,
  weekly: 1,
}

export function normalizeCrop(crop: string) {
  return crop
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\W+/g, '-')
    .replace(/^-|-$/g, '')
}

export function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', {
    currency: 'BRL',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: 'currency',
  })
}

export function trendFromVariation(variationPct: number): MarketTrend {
  if (variationPct > 0.01) return 'up'
  if (variationPct < -0.01) return 'down'
  return 'flat'
}

export function parseBrazilianDate(value?: string) {
  if (!value) return null
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null
  const [, day, month, year] = match
  return new Date(Number(year), Number(month) - 1, Number(day), 12)
}

export function parseTimestamp(value?: string) {
  if (!value) return undefined
  const normalized = value.includes('T') ? value : value.replace(' ', 'T')
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

export function formatPointLabel(date: Date) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export function historyByPeriod(points: MarketHistoryPoint[]): Record<MarketPeriod, MarketHistoryPoint[]> {
  return {
    annual: points.filter((point) => new Date(point.date) >= periodCutoff('annual')),
    monthly: points.filter((point) => new Date(point.date) >= periodCutoff('monthly')),
    weekly: points.filter((point) => new Date(point.date) >= periodCutoff('weekly')),
  }
}

export function buildVariations(periods: Record<MarketPeriod, MarketHistoryPoint[]>) {
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

function periodCutoff(period: MarketPeriod) {
  const now = new Date()
  const days = period === 'weekly' ? 7 : period === 'monthly' ? 30 : 365
  now.setDate(now.getDate() - days)
  return now
}

function periodLabel(period: MarketPeriod) {
  return period === 'weekly' ? 'Semana' : period === 'monthly' ? 'Mês' : 'Ano'
}

function variationBetween(points: MarketHistoryPoint[]) {
  if (points.length < 2) return null
  const first = points[0].value
  const last = points[points.length - 1].value
  if (!first) return null
  return ((last - first) / first) * 100
}
