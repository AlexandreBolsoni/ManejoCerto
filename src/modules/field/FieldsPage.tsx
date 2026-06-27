import { ArrowRight, Droplets, MapPin, Plus, Sprout, Target } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../../components/ui'
import { LinkButton } from '../../components/ui'
import { PageHeader } from '../../components/ui'
import { EmptyState } from '../../components/ui'
import { useCurrentFarm } from '../../hooks/useCurrentFarm'
import { useFields } from '../../hooks/useFields'
import { marketService } from '../../services/marketService'
import type { MarketQuote, Severity } from '../../types'

export function FieldsPage() {
  const { farm } = useCurrentFarm()
  const { fields, userCrops } = useFields()
  const [activeFilter, setActiveFilter] = useState('Todos')
  const [marketQuotes, setMarketQuotes] = useState<MarketQuote[]>([])
  
  const farmState = useMemo(() => marketService.resolveState(farm?.state || farm?.locationLabel), [farm?.locationLabel, farm?.state])
  const marketProfile = useMemo(() => marketService.getStateProfile(farmState), [farmState])
  const marketRegion = farm ? marketProfile.stateName : 'Brasil'
  const effectiveMarketQuotes = farm ? marketQuotes : []
  
  const filters = useMemo(() => ['Todos', ...Array.from(new Set(fields.map((field) => field.crop))), 'Irrigadas', 'Alto risco'], [fields])
  
  const filteredFields = fields.filter((field) => {
    if (activeFilter === 'Todos') return true
    if (activeFilter === 'Irrigadas') return field.irrigation !== 'Sequeiro'
    if (activeFilter === 'Alto risco') return field.riskLevel === 'alto' || field.riskLevel === 'critico'
    return field.crop === activeFilter
  })

  useEffect(() => {
    if (!farm) return

    marketService
      .listQuotes(userCrops, marketRegion, farmState)
      .then(setMarketQuotes)
      .catch(() => setMarketQuotes([]))
  }, [farm, farmState, marketRegion, userCrops])

  return (
    <section className="page-container">
      <PageHeader
        action={
          <LinkButton to={farm ? '/talhoes/novo' : '/fazenda/nova'}>
            <Plus size={18} aria-hidden="true" />
            {farm ? 'Nova área' : 'Nova fazenda'}
          </LinkButton>
        }
        subtitle="Gerencie glebas, pivôs, piquetes ou talhões."
        title="Áreas de cultivo"
      />

      <div className="filter-row">
        {filters.map((filter) => (
          <button className={activeFilter === filter ? 'active' : ''} key={filter} onClick={() => setActiveFilter(filter)} type="button">
            {filter}
          </button>
        ))}
      </div>

      {!farm ? (
        <EmptyState
          action={<LinkButton to="/fazenda/nova">Cadastrar fazenda</LinkButton>}
          body="A fazenda define a localização base para previsão, radar e alertas."
          title="Nenhuma fazenda cadastrada"
        />
      ) : filteredFields.length === 0 ? (
        <EmptyState
          action={<LinkButton to="/talhoes/novo">Cadastrar área</LinkButton>}
          body="Cadastre uma área para o Manejo Certo transformar clima em decisões por cultura."
          title="Nenhuma área monitorada"
        />
      ) : (
        <div className="field-card-list">
          {filteredFields.map((field) => (
            <Link className="field-row-card" key={field.id} to={`/talhoes/${field.id}`}>
              
              <div className="field-card-content">
                <div className="field-header">
                  <div className="field-icon">
                    <Sprout size={24} color="var(--color-primary-dark)" />
                  </div>
                  <div className="field-title-group">
                    <h2>{field.name}</h2>
                    <p>{field.crop} · {field.stage} · {field.areaHa} ha</p>
                  </div>
                  <div>
                    <Badge tone={field.riskLevel}>{riskLabel(field.riskLevel)}</Badge>
                  </div>
                </div>

                <div className="field-details">
                  <small>
                    <Droplets size={14} color="var(--color-text-muted)" />
                    Irrigação: {field.irrigation}
                  </small>
                  <small>
                    <Target size={14} color="var(--color-text-muted)" />
                    Chuva hoje: {field.rainGaugeMm ? `${field.rainGaugeMm} mm` : 'Sem registro'}
                  </small>
                  <small>
                    <MapPin size={14} color="var(--color-text-muted)" />
                    {marketLineForCrop(field.crop, effectiveMarketQuotes, marketRegion)}
                  </small>
                </div>
              </div>

              <div className="field-decision">
                <div className="decision-text">
                  <span>{field.climateStatus}</span>
                  <strong>{field.currentRecommendation}</strong>
                </div>
                <ArrowRight size={20} />
              </div>
              
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

function riskLabel(risk: Severity) {
  if (risk === 'critico') return 'crítico'
  if (risk === 'alto') return 'alta'
  if (risk === 'moderado') return 'média'
  return 'baixa'
}

function normalizeCrop(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\W+/g, '-')
    .replace(/^-|-$/g, '')
}

function marketLineForCrop(crop: string, quotes: MarketQuote[], region: string) {
  const quote = quotes.find((item) => normalizeCrop(item.crop) === normalizeCrop(crop))
  if (!quote) return `Mercado ${region}: sem preço`
  if (quote.quoteStatus === 'unavailable') return `Mercado ${region}: sem preço`
  return `Mercado ${region}: ${quote.price}${quote.unit}`
}