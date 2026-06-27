import { ArrowLeft, CloudRain, Droplets, Map, Sprout, TrendingUp } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Badge } from '../../components/ui'
import { LinkButton } from '../../components/ui'
import { useFields } from '../../hooks/useFields'

export function FieldDetailPage() {
  const { fieldId } = useParams()
  const { fields } = useFields()
  const field = fields.find((item) => item.id === fieldId) ?? fields[0]

  if (!field) {
    return (
      <section className="page-container">
        <div className="detail-card" style={{ textAlign: 'center', marginTop: '2rem' }}>
          <h2>Área não encontrada</h2>
          <LinkButton to="/talhoes" className="action-btn">Voltar para áreas</LinkButton>
        </div>
      </section>
    )
  }

  return (
    <section className="page-container">
      <div>
        <Link className="back-link" to="/talhoes">
          <ArrowLeft size={20} aria-hidden="true" />
          Voltar
        </Link>
      </div>
      
      <header className="field-detail-hero">
        <div className="field-icon">
          <Sprout size={32} aria-hidden="true" />
        </div>
        <div>
          <h1>{field.name}</h1>
          <p>
            {field.crop} · {field.stage} · {field.areaHa} ha
          </p>
        </div>
        <Badge tone={field.riskLevel}>{field.riskLevel}</Badge>
      </header>
      
      <div className="field-detail-grid">
        <div className="detail-card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
          <span>STATUS E RECOMENDAÇÃO</span>
          <h2 style={{ color: 'var(--color-primary-dark)' }}>{field.currentRecommendation}</h2>
          <p>{field.climateStatus}</p>
        </div>
        
        <div className="detail-card">
          <span>IRRIGAÇÃO E SOLO</span>
          <h2>
             <Droplets size={20} color="var(--color-primary)" /> 
             {field.irrigation}
          </h2>
          <p>Solo {field.soilType}. Sensível a {field.sensitivities.join(', ')}.</p>
        </div>
        
        <div className="detail-card">
          <span>LOCALIZAÇÃO GEOGRÁFICA</span>
          <h2>
            <Map size={20} color="var(--color-primary)" />
            {field.coordinates ? 'GPS Ativo' : 'Sem GPS'}
          </h2>
          <p>
            {field.coordinates 
              ? `${field.coordinates.latitude.toFixed(5)}, ${field.coordinates.longitude.toFixed(5)} (Precisão: ±${Math.round(field.coordinates.accuracyM ?? 0)}m)` 
              : 'Use o cadastro da área para melhorar o radar.'}
          </p>
        </div>
        
        <div className="detail-card">
          <span>OBSERVAÇÃO LOCAL</span>
          <h2>
            <CloudRain size={20} color="var(--color-primary)" />
            {field.rainGaugeMm ? `${field.rainGaugeMm} mm` : 'Sem dados hoje'}
          </h2>
          <p>Última atualização: {field.lastUpdate}.</p>
        </div>
        
        <div className="detail-card">
          <span>AÇÃO LOCAL</span>
          <h2>Validar evento</h2>
          <p>Reporte as condições da fazenda para calibrar nossa IA.</p>
          <div className="action-btn">
              <LinkButton to="/feedback">Registrar feedback</LinkButton>
          </div>
        </div>
        
        <div className="detail-card">
          <span>MERCADO</span>
          <h2>
            <TrendingUp size={20} color="var(--color-primary)" />
            Cotação: {field.crop}
          </h2>
          <p>Veja os preços atualizados para a sua região.</p>
          <div className="action-btn">
            <LinkButton variant="secondary" to={`/mercado?cultura=${encodeURIComponent(field.crop)}`}>
              Abrir mercado
            </LinkButton>
          </div>
        </div>
      </div>
    </section>
  )
}