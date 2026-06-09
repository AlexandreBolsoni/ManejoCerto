import { ExternalLink, Minus, Plus, TrendingDown, TrendingUp, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { MarketChart } from '../components/Charts'
import { PageHeader } from '../components/PageHeader'
import { Card } from '../components/Surface'
import { APP_STATE, APP_STATE_NAME } from '../config/brand'
import { useAppData } from '../hooks/useAppData'
import { marketService } from '../services/marketService'
import type { MarketPeriod, MarketQuote } from '../types'

type MarketScope = 'mine' | 'state' | 'all'

const periodLabels: Record<MarketPeriod, string> = {
  annual: 'Anual',
  monthly: 'Mensal',
  weekly: 'Semanal',
}

const scopeLabels: Record<MarketScope, string> = {
  all: 'Todos',
  mine: 'Minhas culturas',
  state: APP_STATE_NAME,
}

export function MarketPage() {
  const { farm, fields } = useAppData()
  const [searchParams, setSearchParams] = useSearchParams()
  const [quotes, setQuotes] = useState<MarketQuote[]>([])
  const [selectedCrop, setSelectedCrop] = useState(searchParams.get('cultura') ?? 'Todos')
  const [scope, setScope] = useState<MarketScope>('mine')
  const [chartPeriod, setChartPeriod] = useState<MarketPeriod>('weekly')
  const [newCrop, setNewCrop] = useState('Café Conilon')
  const [detailQuote, setDetailQuote] = useState<MarketQuote | null>(null)
  const userCrops = useMemo(() => Array.from(new Set(fields.map((field) => field.crop))), [fields])
  const activeState = APP_STATE
  const activeProfile = useMemo(() => marketService.getStateProfile(activeState), [activeState])
  const marketRegion = activeProfile.stateName
  const visibleProducts = activeProfile.products.slice(0, 10)
  const scopedQuotes = useMemo(() => filterByScope(quotes, scope, userCrops, visibleProducts.map((product) => product.crop)), [quotes, scope, userCrops, visibleProducts])
  const filteredQuotes = selectedCrop === 'Todos' ? scopedQuotes : scopedQuotes.filter((quote) => sameCrop(quote.crop, selectedCrop))
  const featuredQuote = marketService.selectFeaturedQuote(scopedQuotes, userCrops)
  const officialSources = marketService.officialSources()
  const sourceSummary = officialSources.filter((source) => source.priority === 'base').slice(0, 4)

  useEffect(() => {
    marketService
      .listQuotes(userCrops, marketRegion, activeState)
      .then(setQuotes)
      .catch(() => setQuotes([]))
  }, [activeState, marketRegion, scope, userCrops])

  const selectCrop = (crop: string) => {
    setSelectedCrop(crop)
    setSearchParams(crop === 'Todos' ? {} : { cultura: crop })
  }

  const addCrop = async () => {
    const nextQuotes = await marketService.addQuote(newCrop, marketRegion, activeState, userCrops)
    setQuotes(nextQuotes)
    selectCrop(newCrop)
    setScope('all')
  }

  const openSource = (sourceUrl?: string) => {
    if (!sourceUrl) return
    const popup = window.open(sourceUrl, '_blank', 'noopener,noreferrer')
    if (popup) popup.opener = null
  }

  return (
    <section className="market-page">
      <PageHeader
        subtitle={farm ? `${marketRegion} · melhor referência disponível por cultura, sem inventar preço quando a fonte oficial não existe.` : 'Referências agrícolas priorizadas para o Espírito Santo.'}
        title="Mercado capixaba"
      />

      <div className="market-scope-row" aria-label="Escopo do mercado">
        {(Object.keys(scopeLabels) as MarketScope[]).map((item) => (
          <button className={scope === item ? 'active' : ''} key={item} onClick={() => setScope(item)} type="button">
            {scopeLabels[item]}
          </button>
        ))}
      </div>

      {featuredQuote ? (
        <section className="market-topline">
          <Card className={`market-feature-card ${featuredQuote.quoteStatus ?? 'unavailable'}`}>
            <div className="market-card-head">
              <div>
                <span className="eyebrow">MERCADO HOJE</span>
                <h2>{headlineForQuote(featuredQuote)}</h2>
              </div>
              <Badge tone={toneForQuote(featuredQuote)}>{marketService.quoteStatusLabel(featuredQuote)}</Badge>
            </div>
            <div className={`market-price ${isPricedQuote(featuredQuote) ? '' : 'unavailable'}`}>
              <strong>{featuredQuote.price}</strong>
              <span>{featuredQuote.unit}</span>
            </div>
            <div className="market-feature-meta">
              <span>{marketService.quoteTypeLabel(featuredQuote)}</span>
              <span>{marketService.quoteFallbackLabel(featuredQuote)}</span>
              <span>{featuredQuote.quotedAt ? formatQuoteDate(featuredQuote.quotedAt) : featuredQuote.freshnessLabel ?? 'sem atualização publicada'}</span>
            </div>
            <p>{featuredQuote.whyMonitor ?? featuredQuote.dataQualityLabel}</p>
            <div className="market-feature-actions">
              <Button onClick={() => setDetailQuote(featuredQuote)} type="button">
                Ver histórico
              </Button>
              <Button disabled={!featuredQuote.sourceUrl} onClick={() => openSource(featuredQuote.sourceUrl)} type="button" variant="secondary">
                Fonte <ExternalLink size={15} aria-hidden="true" />
              </Button>
            </div>
          </Card>

          <Card className="market-source-card">
            <span className="eyebrow">COBERTURA BASE</span>
            <h2>{activeProfile.stateName}</h2>
            <p>{activeProfile.summary}</p>
            <div className="market-source-stack">
              {sourceSummary.map((source) => (
                <span key={source.id}>
                  <strong>{source.label}</strong>
                  <small>{marketService.sourceTypeLabel(source.type)}</small>
                </span>
              ))}
            </div>
          </Card>
        </section>
      ) : null}

      <div className="market-culture-row" aria-label="Filtros de cultura">
        <button className={selectedCrop === 'Todos' ? 'active' : ''} onClick={() => selectCrop('Todos')} type="button">
          Todos
        </button>
        {visibleProducts.map((product) => (
          <button className={selectedCrop === product.crop ? 'active' : ''} key={product.crop} onClick={() => selectCrop(product.crop)} type="button">
            {product.crop}
          </button>
        ))}
      </div>

      <div className="market-toolbar compact">
        <div className="chart-mode-control" aria-label="Período do gráfico do detalhe">
          {(['weekly', 'monthly', 'annual'] as MarketPeriod[]).map((period) => (
            <button className={chartPeriod === period ? 'active' : ''} key={period} onClick={() => setChartPeriod(period)} type="button">
              {periodLabels[period]}
            </button>
          ))}
        </div>
        <div className="add-market-crop">
          <select onChange={(event) => setNewCrop(event.target.value)} value={newCrop}>
            {marketService.availableCrops().map((crop) => (
              <option key={crop}>{crop}</option>
            ))}
          </select>
          <Button onClick={() => void addCrop()} size="sm" type="button">
            <Plus size={15} aria-hidden="true" />
            Adicionar
          </Button>
        </div>
      </div>

      <div className="market-feed-list">
        {filteredQuotes.length === 0 ? (
          <Card className="empty-state">
            <h2>Nenhuma cultura neste filtro</h2>
            <p>Troque o filtro ou adicione uma cultura para acompanhar.</p>
          </Card>
        ) : null}
        {filteredQuotes.map((quote) => {
          const TrendIcon = quote.trend === 'up' ? TrendingUp : quote.trend === 'down' ? TrendingDown : Minus
          const isPriced = isPricedQuote(quote)

          return (
            <Card className={`market-feed-card ${quote.quoteStatus ?? 'unavailable'}`} key={quote.id}>
              <div className="market-feed-main">
                <div>
                  <h2>{quote.crop}</h2>
                  <p>{quote.relevanceLabel ?? quote.region}</p>
                </div>
                <Badge tone={toneForQuote(quote)}>
                  {isPriced ? <TrendIcon size={14} aria-hidden="true" /> : null}
                  {isPriced ? marketService.quoteTrendLabel(quote) : 'sem preço'}
                </Badge>
              </div>
              <div className={`market-feed-price ${isPriced ? '' : 'unavailable'}`}>
                <strong>{quote.price}</strong>
                <span>{quote.unit}</span>
              </div>
              <div className="market-feed-meta">
                <span>{marketService.quoteTypeLabel(quote)}</span>
                <span>{marketService.quoteFallbackLabel(quote)}</span>
                <span>{quote.source}</span>
              </div>
              <div className="market-feed-actions">
                <Button onClick={() => setDetailQuote(quote)} size="sm" type="button" variant="ghost">
                  ver detalhe
                </Button>
                {isPriced ? <strong>{formatVariation(quote.variationPct)}</strong> : <strong>fonte pendente</strong>}
              </div>
            </Card>
          )
        })}
      </div>

      {detailQuote ? (
        <div className="market-detail-backdrop" onClick={() => setDetailQuote(null)} role="presentation">
          <section aria-label={`Detalhe de mercado de ${detailQuote.crop}`} aria-modal="true" className="market-detail-sheet" onClick={(event) => event.stopPropagation()} role="dialog">
            <header>
              <div>
                <span className="eyebrow">{detailQuote.region}</span>
                <h2>{detailQuote.crop}</h2>
              </div>
              <button aria-label="Fechar detalhe" onClick={() => setDetailQuote(null)} type="button">
                <X size={20} aria-hidden="true" />
              </button>
            </header>
            <div className={`market-price ${isPricedQuote(detailQuote) ? '' : 'unavailable'}`}>
              <strong>{detailQuote.price}</strong>
              <span>{detailQuote.unit}</span>
            </div>
            <div className="market-feature-meta">
              <span>{marketService.quoteStatusLabel(detailQuote)}</span>
              <span>{marketService.quoteTypeLabel(detailQuote)}</span>
              <span>{marketService.quoteFallbackLabel(detailQuote)}</span>
            </div>
            <MarketChart period={chartPeriod} points={detailQuote.historyByPeriod?.[chartPeriod]} trend={detailQuote.trend} values={detailQuote.history} />
            <p>{detailQuote.dataQualityLabel ?? detailQuote.whyMonitor}</p>
            <div className="market-detail-facts">
              <span>
                <strong>Fonte</strong>
                {detailQuote.source ?? 'fonte pendente'}
              </span>
              <span>
                <strong>Atualização</strong>
                {detailQuote.quotedAt ? formatQuoteDate(detailQuote.quotedAt) : detailQuote.freshnessLabel ?? 'sem data publicada'}
              </span>
              <span>
                <strong>Variação</strong>
                {isPricedQuote(detailQuote) ? formatVariation(detailQuote.variationPct) : 'sem série'}
              </span>
            </div>
            <Button disabled={!detailQuote.sourceUrl} onClick={() => openSource(detailQuote.sourceUrl)} type="button" variant="secondary">
              Abrir fonte <ExternalLink size={15} aria-hidden="true" />
            </Button>
          </section>
        </div>
      ) : null}
    </section>
  )
}

function normalizeCrop(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\W+/g, '-')
    .replace(/^-|-$/g, '')
}

function sameCrop(left: string, right: string) {
  return normalizeCrop(left) === normalizeCrop(right)
}

function quoteMatchesAnyCrop(quote: MarketQuote, crops: string[]) {
  return crops.some((crop) => sameCrop(quote.crop, crop))
}

function filterByScope(quotes: MarketQuote[], scope: MarketScope, userCrops: string[], profileCrops: string[]) {
  if (scope === 'mine' && userCrops.length > 0) return quotes.filter((quote) => quoteMatchesAnyCrop(quote, userCrops))
  if (scope === 'state') return quotes.filter((quote) => quoteMatchesAnyCrop(quote, profileCrops))
  return quotes
}

function headlineForQuote(quote: MarketQuote) {
  if (quote.quoteStatus === 'unavailable') return `${quote.crop} ainda sem preço para ${quote.region}`
  if (quote.quoteStatus === 'reference') return `${quote.crop} tem referência em validação para ${quote.region}`
  return `${quote.crop} está ${marketService.quoteTrendLabel(quote)} em ${quote.region}`
}

function toneForQuote(quote: MarketQuote) {
  if (quote.quoteStatus === 'reference') return 'amber'
  if (quote.quoteStatus !== 'real') return 'soft'
  if (quote.trend === 'up') return 'green'
  if (quote.trend === 'down') return 'red'
  return 'soft'
}

function isPricedQuote(quote: MarketQuote) {
  return quote.quoteStatus === 'real' || quote.quoteStatus === 'reference'
}

function formatVariation(value: number) {
  if (Math.abs(value) < 0.01) return '0,0%'
  return `${value > 0 ? '+' : ''}${value.toLocaleString('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 })}%`
}

function formatQuoteDate(value: string) {
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
