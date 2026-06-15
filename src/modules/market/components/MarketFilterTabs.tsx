import { Plus } from 'lucide-react'
import { Button } from '../../../components/ui'
import type { MarketPageState } from '../hooks/useMarketPage'
import { filterOptions } from '../types/marketPage.types'

export function MarketFilterTabs({ market }: { market: MarketPageState }) {
  return (
    <div className="market-filter-row" aria-label="Filtros de mercado">
      {filterOptions.map((filter) => (
        <button className={market.activeFilter === filter.value ? 'active' : ''} key={filter.value} onClick={() => market.setActiveFilter(filter.value)} type="button">
          {filter.label}
        </button>
      ))}
      <div className="market-add-crop-inline">
        <select aria-label="Cultura para adicionar" onChange={(event) => market.setNewCrop(event.target.value)} value={market.newCrop}>
          {market.availableCrops.map((crop) => (
            <option key={crop}>{crop}</option>
          ))}
        </select>
        <Button disabled={market.loading} onClick={() => void market.addCrop()} size="sm" type="button" variant="ghost">
          <Plus size={15} aria-hidden="true" />
          Adicionar cultura
        </Button>
      </div>
    </div>
  )
}
