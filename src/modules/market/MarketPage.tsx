import { MarketDetailPanel } from './components/MarketDetailPanel'
import { MarketFilterTabs } from './components/MarketFilterTabs'
import { MarketHeader } from './components/MarketHeader'
import { MarketQuoteGrid } from './components/MarketQuoteGrid'
import { useMarketPage } from './hooks/useMarketPage'

export function MarketPage() {
  const market = useMarketPage()

  return (
    <section className="market-page market-layered-page">
      <MarketHeader market={market} />
      <MarketFilterTabs market={market} />
      <MarketQuoteGrid market={market} />
      <MarketDetailPanel market={market} />
    </section>
  )
}
