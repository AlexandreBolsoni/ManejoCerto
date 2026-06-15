import type { MarketPeriod } from '../../../types'

export type MarketFilter = 'all' | 'coffee' | 'fruits' | 'vegetables' | 'grains' | 'mine'
export type MarketDetailTab = 'summary' | 'history' | 'compare' | 'sources' | 'advanced'
export type MarketCompareMode = 'price' | 'trend'

export const periodOptions: { label: string; value: MarketPeriod }[] = [
  { label: '7 dias', value: 'weekly' },
  { label: '30 dias', value: 'monthly' },
  { label: '12 meses', value: 'annual' },
]

export const periodTabLabels: Record<MarketPeriod, string> = {
  annual: 'Anual',
  monthly: 'Mensal',
  weekly: 'Semanal',
}

export const filterOptions: { label: string; value: MarketFilter }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Café', value: 'coffee' },
  { label: 'Frutas', value: 'fruits' },
  { label: 'Hortaliças', value: 'vegetables' },
  { label: 'Grãos', value: 'grains' },
  { label: 'Minhas culturas', value: 'mine' },
]

export const detailTabs: { label: string; value: MarketDetailTab }[] = [
  { label: 'Resumo', value: 'summary' },
  { label: 'Histórico', value: 'history' },
  { label: 'Comparar', value: 'compare' },
  { label: 'Fontes', value: 'sources' },
  { label: 'Avançado', value: 'advanced' },
]
