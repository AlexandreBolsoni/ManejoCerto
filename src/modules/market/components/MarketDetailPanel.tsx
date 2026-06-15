import { CloudRain, ExternalLink, Globe2, ShieldCheck } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Badge, Button, Card } from '../../../components/ui'
import { MarketChart } from '../../../components/Charts'
import { marketService } from '../../../services/marketService'
import type { MarketPageState } from '../hooks/useMarketPage'
import { detailTabs, periodOptions, periodTabLabels } from '../types/marketPage.types'
import {
  compactSourceName,
  dataQualityLabels,
  formatQuoteDate,
  formatVariation,
  indexBarWidth,
  indexedTrendForQuote,
  isPricedQuote,
  sameCrop,
  toneForQuote,
} from '../utils/marketView'

export function MarketDetailPanel({ market }: { market: MarketPageState }) {
  const selectedQuote = market.selectedQuote
  if (!selectedQuote) {
    return (
      <Card className="empty-state">
        <h2>Nenhuma cultura neste filtro</h2>
        <p>Troque o filtro ou adicione uma cultura para acompanhar.</p>
      </Card>
    )
  }

  return (
    <Card className="market-detail-panel">
      <header className="market-detail-hero">
        <div>
          <span className="eyebrow">DETALHE DA CULTURA</span>
          <h2>
            {selectedQuote.crop} {market.activeState}
          </h2>
          <p>
            Fonte: {compactSourceName(selectedQuote.source)} ·{' '}
            {selectedQuote.quotedAt ? `Atualizado em ${formatQuoteDate(selectedQuote.quotedAt)}` : selectedQuote.freshnessLabel ?? 'sem data publicada'}
          </p>
        </div>
        <div>
          <div className={`market-price ${isPricedQuote(selectedQuote) ? '' : 'unavailable'}`}>
            <strong>{selectedQuote.price}</strong>
            <span>{selectedQuote.unit}</span>
          </div>
          <Badge tone={toneForQuote(selectedQuote)}>
            <ShieldCheck size={14} aria-hidden="true" />
            {marketService.quoteStatusLabel(selectedQuote)}
          </Badge>
        </div>
      </header>

      <div className="market-detail-tabs" aria-label="Detalhes de mercado">
        {detailTabs.map((tab) => (
          <button className={market.detailTab === tab.value ? 'active' : ''} key={tab.value} onClick={() => market.setDetailTab(tab.value)} type="button">
            {tab.label}
          </button>
        ))}
      </div>

      {market.detailTab === 'summary' ? <MarketSummaryPanel market={market} /> : null}
      {market.detailTab === 'history' ? <MarketHistoryPanel market={market} /> : null}
      {market.detailTab === 'compare' ? <MarketComparePanel market={market} /> : null}
      {market.detailTab === 'sources' ? <MarketSourcePanel market={market} /> : null}
      {market.detailTab === 'advanced' ? <MarketAdvancedPanel market={market} /> : null}
    </Card>
  )
}

function MarketSummaryPanel({ market }: { market: MarketPageState }) {
  const selectedQuote = market.selectedQuote
  if (!selectedQuote) return null

  return (
    <div className="market-tab-panel market-summary-grid">
      <div className="market-summary-main">
        <h3>Leitura rápida</h3>
        <ul className="market-insight-list">
          {market.quickInsights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="market-quality-panel">
        <h3>Qualidade do dado</h3>
        <div className="market-quality-chips">
          {dataQualityLabels(selectedQuote, market.chartPeriod).map((label) => (
            <span className={`market-data-chip ${label.tone}`} key={label.text}>
              {label.text}
            </span>
          ))}
        </div>
        <p>{selectedQuote.dataQualityLabel ?? selectedQuote.whyMonitor}</p>
      </div>
      <div className="market-climate-context">
        <button onClick={() => market.setShowClimateImpact((current) => !current)} type="button">
          <CloudRain size={16} aria-hidden="true" />
          Clima pode afetar preço?
        </button>
        {market.showClimateImpact ? (
          <>
            <div className="market-climate-grid">
              {market.climateRows.map((row) => (
                <span key={row.label}>
                  <strong>{row.label}</strong>
                  <small>{row.value}</small>
                </span>
              ))}
            </div>
            <p>{selectedQuote.whyMonitor ?? 'Clima altera oferta, qualidade, colheita e logística.'}</p>
          </>
        ) : null}
      </div>
    </div>
  )
}

function MarketHistoryPanel({ market }: { market: MarketPageState }) {
  const selectedQuote = market.selectedQuote
  if (!selectedQuote) return null

  return (
    <div className="market-tab-panel">
      <div className="chart-mode-control" aria-label="Período do gráfico">
        {periodOptions.map((period) => (
          <button className={market.chartPeriod === period.value ? 'active' : ''} key={period.value} onClick={() => market.setChartPeriod(period.value)} type="button">
            {periodTabLabels[period.value]}
          </button>
        ))}
      </div>
      <MarketChart period={market.chartPeriod} points={market.selectedChartPoints} trend={selectedQuote.trend} values={[]} />
      <p>
        {market.chartHasRealSeries
          ? 'Gráfico construído somente com pontos reais publicados pela fonte conectada.'
          : 'Histórico insuficiente para gráfico. Temos apenas a cotação mais recente ou cobertura menor que o mínimo do período.'}
      </p>
    </div>
  )
}

function MarketComparePanel({ market }: { market: MarketPageState }) {
  const selectedQuote = market.selectedQuote
  if (!selectedQuote) return null

  return (
    <div className="market-tab-panel">
      <div className="market-compare-toolbar">
        <div>
          <h3>Comparar culturas</h3>
          <p>Preço direto ajuda na leitura rápida. Tendência usa índice porque as unidades são diferentes.</p>
        </div>
        <div className="chart-mode-control" aria-label="Modo de comparação">
          <button className={market.compareMode === 'price' ? 'active' : ''} onClick={() => market.setCompareMode('price')} type="button">
            Preço
          </button>
          <button className={market.compareMode === 'trend' ? 'active' : ''} onClick={() => market.setCompareMode('trend')} type="button">
            Tendência
          </button>
        </div>
      </div>

      {market.compareMode === 'price' ? (
        <div className="market-compare-table" role="table" aria-label="Comparação por preço atual">
          <div role="row">
            <strong role="columnheader">Cultura</strong>
            <strong role="columnheader">Preço atual</strong>
            <strong role="columnheader">Variação</strong>
            <strong role="columnheader">Fonte</strong>
          </div>
          {market.comparisonQuotes.map((quote) => (
            <button className={sameCrop(quote.crop, selectedQuote.crop) ? 'active' : ''} key={quote.id} onClick={() => market.selectCrop(quote.crop, 'compare')} role="row" type="button">
              <span role="cell">{quote.crop}</span>
              <span role="cell">
                {quote.price} <small>{quote.unit}</small>
              </span>
              <em className={quote.trend} role="cell">
                {quote.quoteStatus !== 'real' && quote.quoteStatus !== 'reference' ? 'sem preço' : formatVariation(quote.variationPct)}
              </em>
              <span role="cell">{compactSourceName(quote.source)}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="market-index-list">
          {market.comparisonQuotes.map((quote) => {
            const indexed = indexedTrendForQuote(quote, market.chartPeriod)

            return (
              <button className={sameCrop(quote.crop, selectedQuote.crop) ? 'active' : ''} key={quote.id} onClick={() => market.selectCrop(quote.crop, 'compare')} type="button">
                <span>
                  <strong>{quote.crop}</strong>
                  <small>{indexed ? `100 → ${indexed.to.toFixed(1)}` : 'histórico insuficiente'}</small>
                </span>
                <i>{indexed ? <b style={{ width: `${indexBarWidth(indexed.to)}%` } as CSSProperties} /> : null}</i>
                <em className={indexed?.changePct && indexed.changePct < 0 ? 'down' : 'up'}>{indexed ? formatVariation(indexed.changePct) : 'sem índice'}</em>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function MarketSourcePanel({ market }: { market: MarketPageState }) {
  const selectedQuote = market.selectedQuote
  if (!selectedQuote) return null

  return (
    <div className="market-tab-panel">
      <div className="market-source-detail-grid">
        <article>
          <h3>Fonte principal</h3>
          <strong>{compactSourceName(selectedQuote.source)}</strong>
          <p>{selectedQuote.quoteType ?? marketService.quoteTypeLabel(selectedQuote)}</p>
          <Button disabled={!selectedQuote.sourceUrl} onClick={() => market.openSource(selectedQuote.sourceUrl)} size="sm" type="button" variant="secondary">
            Abrir fonte <ExternalLink size={15} aria-hidden="true" />
          </Button>
        </article>
        <article>
          <h3>Regra de gráfico</h3>
          <strong>{market.chartHasRealSeries ? 'Histórico real' : 'Dados insuficientes'}</strong>
          <p>Estimativas internas podem aparecer nos cards, mas não são usadas como linha histórica.</p>
        </article>
      </div>
      <div className="market-source-grid">
        {market.sourceCards.map((source) => (
          <button key={source.id} onClick={() => market.openSource(source.sourceUrl)} type="button">
            <span>{source.label}</span>
            <small>{marketService.sourceTypeLabel(source.type)}</small>
            <ExternalLink size={13} aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  )
}

function MarketAdvancedPanel({ market }: { market: MarketPageState }) {
  return (
    <div className="market-tab-panel">
      <div className="market-advanced-intro">
        <Globe2 size={18} aria-hidden="true" />
        <p>Dados avançados ficam separados da primeira visão para não transformar preço de hoje em central técnica.</p>
      </div>
      <div className="market-advanced-grid">
        {market.advancedCards.map((card) => (
          <article key={card.title}>
            <span>{card.status}</span>
            <strong>{card.title}</strong>
            <p>{card.body}</p>
          </article>
        ))}
      </div>
      <p className="market-disclaimer">Valores são referências de mercado. O preço final pode variar por qualidade, praça, comprador e negociação.</p>
    </div>
  )
}
