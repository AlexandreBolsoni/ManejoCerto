import type { Coordinates } from '../types'

export function locationButtonLabel(coordinates: Coordinates | null | undefined) {
  if (!coordinates) return 'Usar localização aproximada'
  if (coordinates.source === 'rede') return 'Local por rede'
  if (coordinates.source === 'fazenda') return 'Pino da fazenda'
  if (coordinates.source === 'ibge' || coordinates.source === 'manual') return 'Local da fazenda'
  if (coordinates.accuracyM) return `Local ±${Math.round(coordinates.accuracyM)} m`
  return 'Local ativo'
}

export function mapLocationStatus(coordinates: Coordinates | null | undefined, hasFarm: boolean) {
  if (coordinates?.source === 'rede') return 'local por rede'
  if (coordinates?.source === 'fazenda') return 'pino da fazenda'
  if (coordinates) return coordinates.accuracyM ? `local ±${Math.round(coordinates.accuracyM)} m` : 'local ativo'
  return hasFarm ? 'local aproximado da fazenda' : 'sem fazenda cadastrada'
}
