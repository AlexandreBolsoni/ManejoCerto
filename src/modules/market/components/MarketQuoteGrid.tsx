import { Card, DataState } from '../../../components/ui'
import type { MarketPageState } from '../hooks/useMarketPage'
import { compactSourceName, cropIcons, dataQualityTone, formatQuoteDate, isPricedQuote, primaryDataQualityLabel, quoteStatusLine, sameCrop } from '../utils/marketView'

export function MarketQuoteGrid({ market }: { market: MarketPageState }) {
  return (
    <section className="market-today-section">
      <div className="market-section-title">
        <div>
          <span className="eyebrow">PREÇOS DE HOJE</span>
          <h2>Hoje no ES</h2>
        </div>
        <p>Preço atual, variação e qualidade do dado sem abrir a tela técnica de primeira.</p>
      </div>

      <DataState
        empty={market.todayQuotes.length === 0}
        emptyState={
          <Card className="empty-state">
            <h2>Nenhuma cultura neste filtro</h2>
            <p>Troque o filtro ou adicione uma cultura para acompanhar.</p>
          </Card>
        }
        loadingState={
          <Card className="market-loading-card">
            <strong>Carregando cotações...</strong>
            <span>Buscando as referências disponíveis para {market.marketRegion}.</span>
          </Card>
        }
        status={market.loading && market.quotes.length === 0 ? 'loading' : 'success'}
      >
        <div className="market-today-grid">
          {market.todayQuotes.map((quote) => (
            <button className={`market-price-card ${sameCrop(quote.crop, market.selectedQuote?.crop ?? '') ? 'active' : ''}`} key={quote.id} onClick={() => market.selectCrop(quote.crop)} type="button">
              <span className="market-crop-mark">{cropIcons[quote.crop] ?? '•'}</span>
              <div>
                <strong>{quote.crop}</strong>
                <small>{compactSourceName(quote.source)}</small>
              </div>
              <div className={`market-price ${isPricedQuote(quote) ? '' : 'unavailable'}`}>
                <strong>{quote.price}</strong>
                <span>{quote.unit}</span>
              </div>
              <em className={quote.trend}>{quoteStatusLine(quote)}</em>
              <span className={`market-data-chip ${dataQualityTone(quote, market.chartPeriod)}`}>{primaryDataQualityLabel(quote, market.chartPeriod)}</span>
              <small>{quote.quotedAt ? formatQuoteDate(quote.quotedAt) : quote.freshnessLabel ?? 'sem data publicada'}</small>
            </button>
          ))}
        </div>
      </DataState>
    </section>
  )
}
