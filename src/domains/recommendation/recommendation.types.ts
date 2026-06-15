import type { Severity } from '../shared/shared.types'

export type RecommendationKind = 'irrigacao' | 'pulverizacao' | 'clima' | 'mercado'

export type Recommendation = {
  id: string
  kind: RecommendationKind
  title: string
  description: string
  action: string
  justification: string
  confidence: number
  sources: string[]
  severity: Severity
  fieldId: string
  fieldName: string
  updatedAt: string
}
