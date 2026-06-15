import { ArrowRight, MapPinned } from 'lucide-react'
import { Badge, Card, LinkButton } from '../../../components/ui'
import type { Coordinates } from '../../../types'

export type RadarPreviewProps = {
  radarStatus: string
  userLocation: Coordinates | null
}

export function RadarPreview({ radarStatus, userLocation }: RadarPreviewProps) {
  return (
    <Card className="radar-card">
      <div className="card-title-row">
        <span>
          <MapPinned size={18} aria-hidden="true" />
          Radar meteorológico
        </span>
        <Badge tone={userLocation ? 'green' : 'moderado'}>{userLocation ? 'Local ativo' : 'Local aproximado'}</Badge>
      </div>
      <div className="radar-preview">
        <div className="radar-preview-map" aria-hidden="true">
          <i />
          <i />
          <i />
          <span />
        </div>
        <div>
          <strong>{radarStatus}</strong>
          <p>Camada visual de precipitação para orientar a próxima janela operacional.</p>
          <LinkButton size="sm" to="/mapa">
            Ver radar <ArrowRight size={16} aria-hidden="true" />
          </LinkButton>
        </div>
      </div>
    </Card>
  )
}
