export type Feedback = {
  id: string
  fieldId: string
  rained: boolean | null
  rainMm: number
  frost: boolean
  forecastWasRight: boolean | null
  recommendationWasUseful: boolean | null
  notes: string
  createdAt: string
  status: 'queued' | 'synced'
}
