import { ClipboardList, Leaf } from 'lucide-react'
import { Card } from '../../../components/ui'
import type { Recommendation, WeatherSnapshot } from '../../../types'

export type DaySummaryProps = {
  et0Description: string
  recommendation?: Recommendation
  sources: WeatherSnapshot['sources']
}

export function DaySummary({ et0Description, recommendation, sources }: DaySummaryProps) {
  return (
    <Card className="day-summary-card">
      <div className="card-title-row">
        <span>
          <ClipboardList size={17} aria-hidden="true" />
          Resumo do dia
        </span>
      </div>
      <div className="day-summary-main">
        <span>
          <Leaf size={24} aria-hidden="true" />
        </span>
        <div>
          <strong>{recommendation?.title ?? 'Operação climática em observação'}</strong>
          <p>{recommendation?.justification ?? et0Description}</p>
        </div>
      </div>
      <div className="source-status-list">
        {sources.slice(0, 3).map((source) => (
          <article key={source.name}>
            <span>{source.name}</span>
            <div>
              <strong>{source.value}</strong>
              <small>{source.detail}</small>
            </div>
          </article>
        ))}
      </div>
    </Card>
  )
}
