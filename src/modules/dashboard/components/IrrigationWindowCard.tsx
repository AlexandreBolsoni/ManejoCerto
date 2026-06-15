import { CalendarClock } from 'lucide-react'
import { Card } from '../../../components/ui'
import type { WeatherSnapshot } from '../../../types'

export function IrrigationWindowCard({ irrigationWindow }: { irrigationWindow: WeatherSnapshot['irrigationWindow'] }) {
  return (
    <Card className="irrigation-window-card">
      <div className="card-title-row">
        <span>
          <CalendarClock size={17} aria-hidden="true" />
          Janela ideal de irrigação
        </span>
      </div>
      <h2>{irrigationWindow.title}</h2>
      <p>{irrigationWindow.description}</p>
      <div className="time-progress">
        <i style={{ width: `${irrigationWindow.progressPct}%` }} />
      </div>
      <div className="time-labels">
        <span>00h</span>
        <span>06h</span>
        <span>12h</span>
        <span>18h</span>
        <span>24h</span>
      </div>
    </Card>
  )
}
