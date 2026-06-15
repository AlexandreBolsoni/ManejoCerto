import type { Coordinates, Severity } from '../shared/shared.types'

export type Field = {
  id: string
  name: string
  crop: string
  areaHa: number
  stage: string
  soilType: string
  irrigation: string
  climateStatus: string
  currentRecommendation: string
  riskLevel: Severity
  lastUpdate: string
  rainGaugeMm?: number
  sensitivities: string[]
  coordinates?: Coordinates
  notes?: string
}
