import { CloudRain } from 'lucide-react'
import { RainTimeline } from '../../../components/Charts'
import { Badge, Card } from '../../../components/ui'
import type { ForecastHour } from '../../../types'

export function RainForecast({ forecastHours }: { forecastHours: ForecastHour[] }) {
  return (
    <Card className="rain-forecast-card">
      <div className="card-title-row">
        <span>
          <CloudRain size={17} aria-hidden="true" />
          Chuva hora a hora
        </span>
        <Badge tone="green">12h</Badge>
      </div>
      {forecastHours.length > 0 ? <RainTimeline hours={forecastHours} /> : <p>Sem previsão horária disponível agora.</p>}
    </Card>
  )
}
