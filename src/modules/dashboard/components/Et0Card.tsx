import { Droplets } from 'lucide-react'
import { Et0Bars } from '../../../components/Charts'
import { Card } from '../../../components/ui'
import type { WeatherSnapshot } from '../../../types'

export function Et0Card({ et0 }: { et0: WeatherSnapshot['et0'] }) {
  return (
    <Card className="et0-card">
      <div className="card-title-row">
        <span>
          <Droplets size={17} aria-hidden="true" />
          Evapotranspiração ET₀
        </span>
      </div>
      <div className="big-metric">
        <strong>{et0.valueMm.toFixed(1)}</strong>
        <span>mm hoje</span>
      </div>
      <p>{et0.description}</p>
      <Et0Bars bars={et0.bars} />
    </Card>
  )
}
