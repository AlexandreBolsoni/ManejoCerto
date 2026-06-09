import { CheckCircle2, CloudSun, ShieldAlert } from 'lucide-react'
import type { RadarWeatherData } from '../../types/weather'

export function WeatherSummaryCard({ data }: { data: RadarWeatherData }) {
  const isFavorable = data.recommendations.spraying.status === 'recommended'

  return (
    <article className={`radar2-summary-card ${data.status.level}`}>
      <span className="radar2-summary-icon">
        <CloudSun size={26} aria-hidden="true" />
      </span>
      <div>
        <span>Resumo do tempo hoje</span>
        <h2>{data.interpretation.title}</h2>
        <p>{data.interpretation.summary}</p>
        <div className={isFavorable ? 'favorable' : 'attention'}>
          {isFavorable ? <CheckCircle2 size={18} aria-hidden="true" /> : <ShieldAlert size={18} aria-hidden="true" />}
          <span>
            <strong>Recomendação</strong>
            {data.interpretation.recommendation}
          </span>
        </div>
      </div>
    </article>
  )
}
