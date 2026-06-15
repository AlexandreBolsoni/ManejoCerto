import { Sprout } from 'lucide-react'
import { Badge, Card } from '../../../components/ui'
import type { Field } from '../../../types'

export type FieldsSummaryProps = {
  fields: Field[]
  highRiskFields: Field[]
  visibleFields: Field[]
}

export function FieldsSummary({ fields, highRiskFields, visibleFields }: FieldsSummaryProps) {
  return (
    <Card className="areas-today-card">
      <div className="card-title-row">
        <span>
          <Sprout size={17} aria-hidden="true" />
          Áreas prioritárias
        </span>
        <Badge tone={highRiskFields.length > 0 ? 'alto' : 'green'}>{highRiskFields.length || fields.length}</Badge>
      </div>
      <div className="today-area-list">
        {visibleFields.slice(0, 4).map((field) => (
          <article key={field.id}>
            <Sprout size={18} aria-hidden="true" />
            <div>
              <strong>{field.name}</strong>
              <span>{field.currentRecommendation}</span>
            </div>
            <Badge tone={field.riskLevel}>{field.riskLevel}</Badge>
          </article>
        ))}
      </div>
    </Card>
  )
}
