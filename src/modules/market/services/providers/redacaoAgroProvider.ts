import type { MarketQuoteProvider } from '../../types/marketProvider.types'
import { formatCurrency, formatPointLabel, normalizeCrop, parseTimestamp, trendFromVariation } from '../marketProviderUtils'

const REDACAO_AGRO_URL = 'https://www.redacaoagro.com.br/api/cotacoes.php'
const REDACAO_SOURCE_URL = 'https://www.redacaoagro.com.br/ferramentas-cotacoes.php'

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

const redacaoCropMap: Record<string, { key: string; quoteType?: string }> = {
  algodao: { key: 'algodao', quoteType: 'Algodão em pluma' },
  'algodao-em-pluma': { key: 'algodao', quoteType: 'Algodão em pluma' },
  'cana-de-acucar': { key: 'acucar', quoteType: 'Açúcar cristal, referência para cadeia da cana' },
  milho: { key: 'milho' },
  soja: { key: 'soja' },
  trigo: { key: 'trigo' },
}

let redacaoPayloadPromise: Promise<RedacaoAgroResponse | null> | null = null

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

export const redacaoAgroProvider: MarketQuoteProvider = {
  name: 'redacaoAgroProvider',

  async getQuote(crop: string) {
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
        label: formatPointLabel(new Date(pointDate)),
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
  },
}
