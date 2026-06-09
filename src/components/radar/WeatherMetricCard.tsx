import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export function WeatherMetricCard({
  detail,
  Icon,
  label,
  tone = 'green',
  value,
}: {
  detail: ReactNode
  Icon: LucideIcon
  label: string
  tone?: 'green' | 'blue' | 'amber' | 'red'
  value: string
}) {
  return (
    <article className={`radar2-metric-card ${tone}`}>
      <header>
        <span><Icon size={19} aria-hidden="true" /></span>
        <small>{label}</small>
      </header>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  )
}
