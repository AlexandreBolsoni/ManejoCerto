import { ArrowRight, Droplets, Plus, Sprout } from 'lucide-react'
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
    <section className="fields-page">
      <PageHeader
        action={
          <LinkButton to={farm ? '/talhoes/novo' : '/fazenda/nova'}>
            <Plus size={18} aria-hidden="true" />
            {farm ? 'Nova área' : 'Nova fazenda'}
          </LinkButton>
        }
        subtitle="Gerencie glebas, pivôs, piquetes ou talhões com decisões por cultura."
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
          body="A fazenda define a localização base para previsão, radar e alertas. Depois você cria áreas, glebas, pivôs ou talhões."
          title="Nenhuma fazenda cadastrada"
        />
      ) : filteredFields.length === 0 ? (
        <EmptyState
          action={<LinkButton to="/talhoes/novo">Cadastrar área</LinkButton>}
          body="Cadastre uma área para o NimbuES transformar clima em decisões por cultura."
          title="Nenhuma área monitorada"
        />
      ) : (
        <div className="field-card-list">
          {filteredFields.map((field) => (
            <Link className="field-row-card" key={field.id} to={`/talhoes/${field.id}`}>
              <span className="drag-handle">⠿</span>
              <span className="field-icon">
                <Sprout size={24} aria-hidden="true" />
              </span>
              <div className="field-main">
                <div>
                  <h2>{field.name}</h2>
                  <Badge tone={field.riskLevel}>{riskLabel(field.riskLevel)}</Badge>
                </div>
                <p>
                  {field.crop} · {field.stage} · {field.areaHa} ha
                </p>
                <small>
                  <Droplets size={14} aria-hidden="true" />
                  {field.irrigation}
                  <span>Pluviômetro: {field.rainGaugeMm ? `${field.rainGaugeMm} mm (hoje)` : '—'}</span>
                  {field.coordinates ? <span>GPS ±{Math.round(field.coordinates.accuracyM ?? 0)} m</span> : null}
                  <span>{marketLineForCrop(field.crop, effectiveMarketQuotes, marketRegion)}</span>
                </small>
              </div>
              <div className="field-decision">
                <span>{field.climateStatus}</span>
                <strong>{field.currentRecommendation}</strong>
                <small>Atualizado {field.lastUpdate}</small>
              </div>
              <ArrowRight size={20} aria-hidden="true" />
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
