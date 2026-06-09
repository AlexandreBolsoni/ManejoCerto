import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  CloudRain,
  Droplets,
  Leaf,
  LineChart,
  LocateFixed,
  MapPinned,
  RefreshCw,
  Sprout,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Badge } from '../components/Badge'
import { Button, LinkButton } from '../components/Button'
import { Et0Bars, RainTimeline } from '../components/Charts'
import { RadarAtmosphereCard } from '../components/radar/QuickWeatherData'
import { Card, EmptyState, OfflineBanner, SkeletonGrid } from '../components/Surface'
import { useAppData } from '../hooks/useAppData'
import { useAuth } from '../hooks/useAuth'
import { fallbackClimate } from '../services/climateService'
import { marketService } from '../services/marketService'
import { mapClimateToRadarWeather } from '../services/weather/weatherMapper'
import type { MarketQuote } from '../types'
import { locationButtonLabel } from '../utils/locationText'

export function DashboardPage() {
  const {
    alerts,
    climate,
    climateLoading,
    farm,
    fields,
    locationError,
    locationStatus,
    refreshClimate,
    requestUserLocation,
    staleData,
    userLocation,
  } = useAppData()
  const { user } = useAuth()
  const dashboard = climate ?? fallbackClimate
  const weather = dashboard.weather
  const recommendation = dashboard.recommendations[0]
  const forecastPreview = weather.forecastHours?.slice(0, 12) ?? []
  const highRiskAreas = fields.filter((field) => field.riskLevel === 'alto' || field.riskLevel === 'critico')
  const userCrops = useMemo(() => Array.from(new Set(fields.map((field) => field.crop))), [fields])
  const farmState = useMemo(() => marketService.resolveState(farm?.state || farm?.locationLabel), [farm?.locationLabel, farm?.state])
  const marketProfile = useMemo(() => marketService.getStateProfile(farmState), [farmState])
  const marketRegion = farm ? marketProfile.stateName : 'Brasil'
  const [marketQuotes, setMarketQuotes] = useState<MarketQuote[]>([])
  const effectiveMarketQuotes = farm ? marketQuotes : []
  const featuredMarket = marketService.selectFeaturedQuote(effectiveMarketQuotes, userCrops)
  const marketPreview = effectiveMarketQuotes.filter((quote) => (userCrops.length > 0 ? userCrops.some((crop) => sameCrop(crop, quote.crop)) : true)).slice(0, 2)
  const firstName = user?.name?.split(' ')[0] ?? 'Alexandre'
  const headerLocation = formatDashboardLocation(marketProfile.stateName, farm?.state, weather.location)
  const visibleFields = highRiskAreas.length > 0 ? highRiskAreas : fields
  const dashboardRadarData = useMemo(() => (farm ? mapClimateToRadarWeather({ climate: dashboard, farm, zones: [] }) : null), [dashboard, farm])

  useEffect(() => {
    if (!farm) return

    marketService
      .listQuotes(userCrops, marketRegion, farmState)
      .then(setMarketQuotes)
      .catch(() => setMarketQuotes([]))
  }, [farm, farmState, marketRegion, userCrops])

  return (
    <section className="dashboard-page">
      <OfflineBanner staleData={staleData} />
      {!farm ? (
        <>
          <header className="dashboard-header">
            <div>
              <span className="eyebrow">PRIMEIRO ACESSO</span>
              <h1>Cadastre sua fazenda</h1>
              <p>O NibusES só calcula clima, radar e recomendações depois que você define a localização operacional.</p>
            </div>
            <div className="dashboard-actions">
              <Button onClick={() => void requestUserLocation()} type="button" variant="secondary">
                <LocateFixed size={17} aria-hidden="true" />
                {locationStatus === 'requesting' ? 'Buscando...' : locationButtonLabel(userLocation)}
              </Button>
              <LinkButton to="/fazenda/nova">Cadastrar fazenda</LinkButton>
            </div>
          </header>
          {locationError ? <p className="inline-warning">{locationError}</p> : null}
          <EmptyState
            action={<LinkButton to="/fazenda/nova">Começar cadastro</LinkButton>}
            body="A localização pode ser aproximada no início. Depois você ajusta o pino da fazenda e de cada área de cultivo para melhorar meteorologia, radar e alertas."
            title="Nenhuma fazenda cadastrada"
          />
        </>
      ) : (
        <>
      <header className="dashboard-header dashboard-today-header">
        <div>
          <h1>Bom dia, {firstName}</h1>
          <p>
            {weather.fieldName} · {weather.crop} · {headerLocation}
          </p>
        </div>
        <div className="dashboard-actions">
          <Button onClick={() => void requestUserLocation()} type="button" variant="secondary">
            <LocateFixed size={17} aria-hidden="true" />
            {locationStatus === 'requesting' ? 'Buscando...' : locationButtonLabel(userLocation)}
          </Button>
          <Button onClick={() => void refreshClimate()} variant="secondary">
            <RefreshCw size={17} aria-hidden="true" />
            Atualizar
          </Button>
        </div>
      </header>
      {locationError ? <p className="inline-warning">{locationError}</p> : null}

      {climateLoading && !climate ? (
        <SkeletonGrid />
      ) : (
        <div className="dashboard-grid">
          {dashboardRadarData ? <RadarAtmosphereCard className="dashboard-atmosphere-card" data={dashboardRadarData} statusLevel="stable" /> : null}

          <Card className="irrigation-window-card">
            <div className="card-title-row">
              <span>
                <CalendarClock size={17} aria-hidden="true" />
                Janela ideal de irrigação
              </span>
            </div>
            <h2>{weather.irrigationWindow.title}</h2>
            <p>{weather.irrigationWindow.description}</p>
            <div className="time-progress">
              <i style={{ width: `${weather.irrigationWindow.progressPct}%` }} />
            </div>
            <div className="time-labels">
              <span>00h</span>
              <span>06h</span>
              <span>12h</span>
              <span>18h</span>
              <span>24h</span>
            </div>
          </Card>

          <Card className="et0-card">
            <div className="card-title-row">
              <span>
                <Droplets size={17} aria-hidden="true" />
                Evapotranspiração ET₀
              </span>
            </div>
            <div className="big-metric">
              <strong>{weather.et0.valueMm.toFixed(1)}</strong>
              <span>mm hoje</span>
            </div>
            <p>{weather.et0.description}</p>
            <Et0Bars bars={weather.et0.bars} />
          </Card>

          <Card className="market-today-card">
            <div className="card-title-row">
              <span>
                <LineChart size={17} aria-hidden="true" />
                Mercado hoje
              </span>
            </div>
            {featuredMarket ? (
              <>
                <h2>{isPricedMarketQuote(featuredMarket) ? `${featuredMarket.crop}: ${marketService.quoteTrendLabel(featuredMarket)}` : `${featuredMarket.crop}: sem preço`}</h2>
                <p>{isPricedMarketQuote(featuredMarket) ? `${featuredMarket.price}${featuredMarket.unit} · ${marketService.quoteStatusLabel(featuredMarket)}` : featuredMarket.dataQualityLabel}</p>
                <div className="market-mini-list">
                  {marketPreview.map((quote) => (
                    <span key={quote.id}>
                      <strong>{quote.crop}</strong>
                      <small>{isPricedMarketQuote(quote) ? `${quote.price}${quote.unit}` : 'sem preço'}</small>
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p>Cadastre culturas nos talhões para montar o acompanhamento de mercado.</p>
            )}
            <LinkButton size="sm" to="/mercado" variant="ghost">
              Ver mercado <ArrowRight size={16} aria-hidden="true" />
            </LinkButton>
          </Card>

          <Card className="today-alert-card">
            <div className="card-title-row">
              <span>
                <Bell size={17} aria-hidden="true" />
                Alertas ativos
              </span>
            </div>
            {alerts.length === 0 ? (
              <div className="alert-clear-state">
                <span>
                  <CheckCircle2 size={30} aria-hidden="true" />
                </span>
                <strong>Nenhum alerta crítico</strong>
                <p>Tudo sob controle por aqui.</p>
              </div>
            ) : (
              <div className="alert-list">
                {alerts.slice(0, 2).map((alert) => (
                  <article className="compact-alert" key={alert.id}>
                    <AlertTriangle size={18} aria-hidden="true" />
                    <div>
                      <strong>{alert.title}</strong>
                      <span>{alert.fieldName} · {alert.timeLabel}</span>
                    </div>
                    <Badge tone={alert.severity}>{alert.severity}</Badge>
                  </article>
                ))}
              </div>
            )}
            {alerts.length > 0 ? (
              <LinkButton size="sm" to="/alertas" variant="ghost">
                Abrir alertas
              </LinkButton>
            ) : null}
          </Card>

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
                <strong>{dashboard.sourceStatus.radar}</strong>
                <p>Camada visual de precipitação para orientar a próxima janela operacional.</p>
                <LinkButton size="sm" to="/mapa">
                  Ver radar <ArrowRight size={16} aria-hidden="true" />
                </LinkButton>
              </div>
            </div>
          </Card>

          <Card className="day-summary-card">
            <div className="card-title-row">
              <span>
                <ClipboardList size={17} aria-hidden="true" />
                Resumo do dia
              </span>
            </div>
            <div className="day-summary-main">
              <span>
                <Leaf size={24} aria-hidden="true" />
              </span>
              <div>
                <strong>{recommendation?.title ?? 'Operação climática em observação'}</strong>
                <p>{recommendation?.justification ?? weather.et0.description}</p>
              </div>
            </div>
            <div className="source-status-list">
              {weather.sources.slice(0, 3).map((source) => (
                <article key={source.name}>
                  <span>{source.name}</span>
                  <div>
                    <strong>{source.value}</strong>
                    <small>{source.detail}</small>
                  </div>
                </article>
              ))}
            </div>
          </Card>

          <Card className="rain-forecast-card">
            <div className="card-title-row">
              <span>
                <CloudRain size={17} aria-hidden="true" />
                Chuva hora a hora
              </span>
              <Badge tone="green">12h</Badge>
            </div>
            {forecastPreview.length > 0 ? <RainTimeline hours={forecastPreview} /> : <p>Sem previsão horária disponível agora.</p>}
          </Card>

          <Card className="areas-today-card">
            <div className="card-title-row">
              <span>
                <Sprout size={17} aria-hidden="true" />
                Áreas prioritárias
              </span>
              <Badge tone={highRiskAreas.length > 0 ? 'alto' : 'green'}>{highRiskAreas.length || fields.length}</Badge>
            </div>
            <div className="today-area-list">
              {visibleFields.slice(0, 4).map((field) => (
                <article key={field.id}>
                  <Sprout size={18} aria-hidden="true" />
                  <div>
                    <strong>{field.name}</strong>
                    <span>{field.currentRecommendation}</span>
                  </div>
                  <Badge tone={field.riskLevel}>{field.riskLevel}</Badge>
                </article>
              ))}
            </div>
          </Card>

        </div>
      )}
        </>
      )}
    </section>
  )
}

function normalizeCrop(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\W+/g, '-')
    .replace(/^-|-$/g, '')
}

function sameCrop(left: string, right: string) {
  return normalizeCrop(left) === normalizeCrop(right)
}

function isPricedMarketQuote(quote: MarketQuote) {
  return quote.quoteStatus === 'real' || quote.quoteStatus === 'reference'
}

function formatDashboardLocation(marketStateName: string, farmState?: string, weatherLocation?: string) {
  const value = [marketStateName, farmState, weatherLocation].find((candidate) => {
    if (!candidate) return false
    const normalized = candidate
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()

    return normalized.includes('espirito santo') || /\bes\b/i.test(candidate)
  })

  if (value) return 'Espírito Santo'

  if (marketStateName && !/[,\d]/.test(marketStateName) && marketStateName !== 'Brasil') {
    return marketStateName
  }

  return 'Espírito Santo'
}
