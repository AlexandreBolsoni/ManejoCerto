import { marketGateway } from '../modules/market/services/marketGateway'

export const marketPriceService = {
  getQuote(crop: string) {
    return marketGateway.getQuote(crop)
  },
}

export type { ProviderQuote } from '../modules/market/types/marketProvider.types'
