import { RefreshCw } from 'lucide-react'
import type { MarketPeriod } from '../../../types'
import { Button } from '../../../components/ui'
import type { MarketPageState } from '../hooks/useMarketPage'
import { periodOptions } from '../types/marketPage.types'

export function MarketHeader({ market }: { market: MarketPageState }) {
  return (
    <header className="market-layered-header">
      <div>
        <h1>Mercado capixaba</h1>
        <p>Preços e tendências das principais culturas do Espírito Santo</p>
      </div>
      <div className="market-layered-actions">
        <label>
          <span>Região</span>
          <select value={market.marketRegion} onChange={() => undefined}>
            <option>{market.marketRegion}</option>
          </select>
        </label>
        <label>
          <span>Período</span>
          <select onChange={(event) => market.setChartPeriod(event.target.value as MarketPeriod)} value={market.chartPeriod}>
            {periodOptions.map((period) => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
        </label>
        <Button disabled={market.loading} onClick={market.refreshQuotes} type="button" variant="secondary">
          <RefreshCw className={market.loading ? 'spin' : ''} size={16} aria-hidden="true" />
          Atualizar
        </Button>
      </div>
    </header>
  )
}
