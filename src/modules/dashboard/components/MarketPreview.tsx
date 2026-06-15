import { ArrowRight, LineChart } from 'lucide-react'
import { Card, LinkButton } from '../../../components/ui'
import { marketService } from '../../../services/marketService'
import type { MarketQuote } from '../../../types'

export type MarketPreviewProps = {
  featuredMarket: MarketQuote | undefined
  marketPreview: MarketQuote[]
}

export function MarketPreview({ featuredMarket, marketPreview }: MarketPreviewProps) {
  return (
    <Card className="market-today-card">
      <div className="card-title-row">
        <span>
          <LineChart size={17} aria-hidden="true" />
          Mercado hoje
        </span>
      </div>
      {featuredMarket ? (
        <>
          <h2>{isPricedMarketQuote(featuredMarket) ? `${featuredMarket.crop}: ${marketService.quoteTrendLabel(featuredMarket)}` : `${featuredMarket.crop}: sem preço`}</h2>
          <p>
            {isPricedMarketQuote(featuredMarket)
              ? `${featuredMarket.price}${featuredMarket.unit} · ${marketService.quoteStatusLabel(featuredMarket)}`
              : featuredMarket.dataQualityLabel}
          </p>
          <div className="market-mini-list">
            {marketPreview.map((quote) => (
              <span key={quote.id}>
                <strong>{quote.crop}</strong>
                <small>{isPricedMarketQuote(quote) ? `${quote.price}${quote.unit}` : 'sem preço'}</small>
              </span>
            ))}
          </div>
        </>
      ) : (
        <p>Cadastre culturas nos talhões para montar o acompanhamento de mercado.</p>
      )}
      <LinkButton size="sm" to="/mercado" variant="ghost">
        Ver mercado <ArrowRight size={16} aria-hidden="true" />
      </LinkButton>
    </Card>
  )
}

function isPricedMarketQuote(quote: MarketQuote) {
  return quote.quoteStatus === 'real' || quote.quoteStatus === 'reference'
}
