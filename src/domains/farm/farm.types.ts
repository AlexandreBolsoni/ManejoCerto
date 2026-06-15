import type { Coordinates } from '../shared/shared.types'

export type Farm = {
  id: string
  name: string
  locality?: string
  localityKind?: 'municipio' | 'distrito' | 'subdistrito' | 'povoado'
  municipality: string
  municipalityId?: number
  state: string
  locationLabel: string
  productionType: string
  areaHa: number
  timezone: string
  coordinates?: Coordinates
  notes?: string
}
