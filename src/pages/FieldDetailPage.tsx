import { ArrowLeft, CloudRain, Droplets, Sprout } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Badge } from '../components/Badge'
import { LinkButton } from '../components/Button'
import { Card } from '../components/Surface'
import { useAppData } from '../hooks/useAppData'

export function FieldDetailPage() {
  const { fieldId } = useParams()
  const { fields } = useAppData()
  const field = fields.find((item) => item.id === fieldId) ?? fields[0]

  if (!field) {
    return (
      <Card className="empty-state">
        <h1>Área não encontrada</h1>
        <LinkButton to="/talhoes">Voltar para áreas</LinkButton>
      </Card>
    )
  }

  return (
    <section className="field-detail-page">
      <Link className="back-link" to="/talhoes">
        <ArrowLeft size={16} aria-hidden="true" />
        Voltar
      </Link>
      <header className="field-detail-hero">
        <span className="field-icon">
          <Sprout size={28} aria-hidden="true" />
        </span>
        <div>
          <h1>{field.name}</h1>
          <p>
            {field.crop} · {field.stage} · {field.areaHa} ha
          </p>
        </div>
        <Badge tone={field.riskLevel}>{field.riskLevel}</Badge>
      </header>
      <div className="field-detail-grid">
        <Card>
          <span>RECOMENDAÇÃO ATUAL</span>
          <h2>{field.currentRecommendation}</h2>
          <p>{field.climateStatus}</p>
        </Card>
        <Card>
          <span>IRRIGAÇÃO</span>
          <h2>{field.irrigation}</h2>
          <p>Solo {field.soilType}. Sensível a {field.sensitivities.join(', ')}.</p>
        </Card>
        <Card>
          <span>LOCALIZAÇÃO</span>
          <h2>{field.coordinates ? `${field.coordinates.latitude.toFixed(5)}, ${field.coordinates.longitude.toFixed(5)}` : 'Sem GPS'}</h2>
          <p>{field.coordinates ? `Precisão aproximada de ±${Math.round(field.coordinates.accuracyM ?? 0)} m.` : 'Use o cadastro da área para melhorar radar e alertas.'}</p>
        </Card>
        <Card>
          <span>OBSERVAÇÃO LOCAL</span>
          <h2>
            <CloudRain size={22} aria-hidden="true" />
            {field.rainGaugeMm ? `${field.rainGaugeMm} mm hoje` : 'Sem pluviômetro'}
          </h2>
          <p>Última atualização {field.lastUpdate}.</p>
        </Card>
        <Card>
          <span>PRÓXIMA AÇÃO</span>
          <h2>
            <Droplets size={22} aria-hidden="true" />
            Validar evento
          </h2>
          <p>Use o feedback local para reduzir falsos positivos de radar.</p>
          <LinkButton to="/feedback">Registrar feedback</LinkButton>
        </Card>
        <Card>
          <span>MERCADO</span>
          <h2>{field.crop}</h2>
          <p>Abra a tela de mercado já filtrada nesta cultura do talhão.</p>
          <LinkButton to={`/mercado?cultura=${encodeURIComponent(field.crop)}`}>Abrir mercado</LinkButton>
        </Card>
      </div>
    </section>
  )
}
