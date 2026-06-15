import {
  Bell,
  Check,
  CheckCircle2,
  ClipboardList,
  CloudRain,
  Droplets,
  Info,
  Layers3,
  Radar,
  Satellite,
  ShieldCheck,
  Thermometer,
  Timer,
  Wind,
  Zap,
} from 'lucide-react'
import type { ForecastHour } from '../../../types'
import type { RadarWeatherData } from '../../../types/weather'
import type { RadarMapLayer, RadarSceneMode } from '../types/radar.types'
import { conditionIcons } from '../utils/radarOptions'
import { decisionItems, operationalConfidence, operationalTitle, quickInsights, rainValue, updatedTimeLabel } from '../utils/radarView'

export function NowCard({ data }: { data: RadarWeatherData }) {
  const CurrentIcon = conditionIcons[data.current.condition]

  return (
    <article className="radar-climate-card now">
      <header>
        <span>
          <CurrentIcon size={21} aria-hidden="true" />
          Agora na fazenda
        </span>
        <small>{updatedTimeLabel(data.updatedAt)}</small>
      </header>
      <div className="radar-climate-now-body">
        <div>
          <strong>{data.current.temperature}°</strong>
          <span>{data.current.description}</span>
        </div>
        <dl>
          <div>
            <dt><CloudRain size={16} aria-hidden="true" /> Chuva em 3h</dt>
            <dd>{data.current.rainNext3h <= 0.1 ? '0–1 mm' : `${data.current.rainNext3h.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mm`}</dd>
          </div>
          <div>
            <dt><Wind size={16} aria-hidden="true" /> Vento</dt>
            <dd>{data.current.windSpeed} km/h</dd>
          </div>
          <div>
            <dt><Droplets size={16} aria-hidden="true" /> Umidade</dt>
            <dd>{data.current.humidity}%</dd>
          </div>
          <div>
            <dt><Thermometer size={16} aria-hidden="true" /> Sensação</dt>
            <dd>{data.current.feelsLike}°</dd>
          </div>
        </dl>
      </div>
    </article>
  )
}

export function QuickReadingCard({ data }: { data: RadarWeatherData }) {
  const icons = [CheckCircle2, CloudRain, ShieldCheck]

  return (
    <article className="radar-climate-card quick">
      <h2><Zap size={19} aria-hidden="true" /> Leitura rápida</h2>
      <div>
        {quickInsights(data).map((item, index) => {
          const Icon = icons[index] ?? CheckCircle2
          return (
            <p key={item}>
              <span><Icon size={16} aria-hidden="true" /></span>
              {item}
            </p>
          )
        })}
      </div>
    </article>
  )
}

export function ActiveLayersCard({
  activeLayer,
  mode,
  onLayerChange,
  onModeChange,
}: {
  activeLayer: RadarMapLayer
  mode: RadarSceneMode
  onLayerChange: (layer: RadarMapLayer) => void
  onModeChange: (mode: RadarSceneMode) => void
}) {
  return (
    <article className="radar-climate-card layers">
      <h2><Layers3 size={19} aria-hidden="true" /> Camadas ativas</h2>
      <div>
        <button className={activeLayer === 'rain' && mode !== 'satellite' ? 'active' : ''} onClick={() => { onModeChange('local'); onLayerChange('rain') }} type="button">
          <Radar size={15} aria-hidden="true" />
          Radar
        </button>
        <button className={mode === 'satellite' ? 'active' : ''} onClick={() => onModeChange('satellite')} type="button">
          <Satellite size={15} aria-hidden="true" />
          Satélite
        </button>
        <button className={activeLayer === 'wind' ? 'active' : ''} onClick={() => onLayerChange('wind')} type="button">
          <Wind size={15} aria-hidden="true" />
          Vento
        </button>
        <button className={activeLayer === 'temperature' ? 'active' : ''} onClick={() => onLayerChange('temperature')} type="button">
          <Thermometer size={15} aria-hidden="true" />
          Temperatura
        </button>
      </div>
    </article>
  )
}

export function OperationalWindowCard({ data }: { data: RadarWeatherData }) {
  const confidence = operationalConfidence(data)

  return (
    <article className="radar-climate-card operational">
      <h2><Timer size={18} aria-hidden="true" /> Janela operacional</h2>
      <div>
        <span>
          <strong>{operationalTitle(data)}</strong>
          <small>{data.status.level === 'stable' ? 'Condição favorável para operações de campo.' : data.status.detail}</small>
        </span>
        <span className="radar-climate-confidence">
          <small>Confiança</small>
          <strong>{confidence}%</strong>
          <i><b style={{ width: `${confidence}%` }} /></i>
        </span>
      </div>
    </article>
  )
}

export function SixHourForecastCard({ hours }: { hours: ForecastHour[] }) {
  const maxRain = Math.max(...hours.map((hour) => hour.precipMm), 1)

  return (
    <article className="radar-climate-card forecast">
      <header>
        <h2><Timer size={18} aria-hidden="true" /> Próximas 6h</h2>
        <Info size={17} aria-hidden="true" />
      </header>
      <p>Previsão de chuva por hora (mm)</p>
      <div className="radar-climate-bars">
        {hours.map((hour) => {
          const height = Math.max(5, Math.round((hour.precipMm / maxRain) * 100))
          return (
            <span key={hour.time}>
              <strong>{rainValue(hour)}</strong>
              <i style={{ height: `${height}%` }} />
              <small>{new Date(hour.time).toLocaleTimeString('pt-BR', { hour: '2-digit' })}</small>
            </span>
          )
        })}
      </div>
    </article>
  )
}

export function LocalAlertsCard({ data }: { data: RadarWeatherData }) {
  const alert = data.alerts[0]

  return (
    <article className="radar-climate-card alerts">
      <h2><Bell size={18} aria-hidden="true" /> Alertas locais</h2>
      {alert ? (
        <div className="radar-climate-alert-list">
          {data.alerts.slice(0, 3).map((item) => (
            <p key={item.id}>
              <CloudRain size={17} aria-hidden="true" />
              <span>
                <strong>{item.title}</strong>
                <small>{item.message}</small>
              </span>
            </p>
          ))}
        </div>
      ) : (
        <div className="radar-climate-clear-alert">
          <span><Check size={25} aria-hidden="true" /></span>
          <strong>Nenhum alerta crítico</strong>
          <p>Tudo sob controle por aqui.</p>
        </div>
      )}
    </article>
  )
}

export function DecisionSummaryCard({ data }: { data: RadarWeatherData }) {
  return (
    <article className="radar-climate-card decision">
      <h2><ClipboardList size={18} aria-hidden="true" /> Resumo para decisão</h2>
      <div>
        {decisionItems(data).map((item) => (
          <p key={item}>
            <span><Check size={16} aria-hidden="true" /></span>
            {item}
          </p>
        ))}
      </div>
    </article>
  )
}
