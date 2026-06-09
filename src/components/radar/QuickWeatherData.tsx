import {
  AlertTriangle,
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSun,
  Droplets,
  Leaf,
  MapPin,
  Snowflake,
  Sprout,
  Sun,
  Thermometer,
  Wind,
  type LucideIcon,
} from 'lucide-react'
import type { RadarWeatherData, WeatherCondition } from '../../types/weather'
import { WeatherMetricCard } from './WeatherMetricCard'

const sprayingLabels = {
  recommended: 'Recomendado',
  attention: 'Atenção',
  not_recommended: 'Não recomendado agora',
}

const irrigationLabels = {
  high_need: 'Alta necessidade',
  moderate_need: 'Necessidade moderada',
  low_need: 'Baixa necessidade',
  not_needed: 'Não necessária agora',
}

const rainIntensityLabels = {
  none: 'baixa',
  light: 'fraca',
  moderate: 'moderada',
  heavy: 'forte',
  storm: 'tempestade',
}

const conditionIcons: Record<WeatherCondition, LucideIcon> = {
  sunny: Sun,
  cloudy: CloudSun,
  rain: CloudRain,
  storm: CloudLightning,
  fog: CloudFog,
  frost: Snowflake,
}

function updatedLabel(updatedAt: string) {
  return new Date(updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function QuickWeatherData({ data }: { data: RadarWeatherData }) {
  const mainAlert = data.alerts[0]

  return (
    <section className="radar2-quick-view" aria-label="Dados rápidos da fazenda">
      <RadarAtmosphereCard data={data} />

      <section className="radar2-field-decisions" aria-labelledby="radar2-field-decisions-title">
        <header>
          <div>
            <span>Decisão no campo</span>
            <h2 id="radar2-field-decisions-title">O que fazer agora</h2>
          </div>
          <p>Recomendações calculadas com a leitura climática mais recente.</p>
        </header>

        <div className="radar2-decision-grid">
          <article className={`radar2-decision-card spray ${data.recommendations.spraying.status}`}>
            <span><Leaf size={22} aria-hidden="true" /></span>
            <div>
              <small>Janela de pulverização</small>
              <h3>{sprayingLabels[data.recommendations.spraying.status]}</h3>
              <p><strong>Motivo:</strong> {data.recommendations.spraying.reason}.</p>
            </div>
          </article>
          <article className={`radar2-decision-card irrigation ${data.recommendations.irrigation.status}`}>
            <span><Sprout size={22} aria-hidden="true" /></span>
            <div>
              <small>Irrigação</small>
              <h3>{irrigationLabels[data.recommendations.irrigation.status]}</h3>
              <p><strong>Motivo:</strong> {data.recommendations.irrigation.reason}.</p>
            </div>
          </article>
        </div>

        <article className={`radar2-alert-card ${mainAlert?.level ?? 'low'}`}>
          <span><AlertTriangle size={22} aria-hidden="true" /></span>
          <div>
            <small>Alertas climáticos</small>
            <h3>{mainAlert?.title ?? 'Nenhum alerta relevante'}</h3>
            <p>{mainAlert?.message ?? 'Não há evento severo previsto para a região da fazenda agora.'}</p>
          </div>
          <em>{mainAlert?.timeLabel ?? 'agora'}</em>
        </article>
      </section>
    </section>
  )
}

export function RadarAtmosphereCard({
  className = '',
  data,
  statusLevel = data.status.level,
}: {
  className?: string
  data: RadarWeatherData
  statusLevel?: RadarWeatherData['status']['level']
}) {
  const CurrentConditionIcon = conditionIcons[data.current.condition] ?? Cloud
  const locationLabel = [data.farm.city, data.farm.state].filter(Boolean).join(', ')
  const classes = ['radar2-atmosphere-card', statusLevel, className].filter(Boolean).join(' ')

  return (
    <article className={classes}>
      <header className="radar2-atmosphere-topline">
        <span className="radar2-atmosphere-location">
          <MapPin size={18} aria-hidden="true" />
          {locationLabel || data.farm.name}
        </span>
        <span className="radar2-atmosphere-status">
          <i aria-hidden="true" />
          {data.status.label}
        </span>
      </header>

      <div className="radar2-atmosphere-content">
        <div className="radar2-current-weather">
          <small>Agora na fazenda</small>
          <div className="radar2-current-temperature">
            <CurrentConditionIcon aria-hidden="true" />
            <strong>
              {data.current.temperature}
              <sup>°C</sup>
            </strong>
          </div>
          <h2>{data.current.description}</h2>
          <p>{data.status.detail}</p>
          <div className="radar2-current-chips">
            <span>Sensação de {data.current.feelsLike}°C</span>
            <span>{data.current.rainNext3h.toFixed(1)} mm nas próximas 3h</span>
          </div>
        </div>

        <div className="radar2-metric-grid">
          <WeatherMetricCard
            detail={<><span>Intensidade {rainIntensityLabels[data.current.rainIntensity]}</span><span>{data.current.rainNext3h.toFixed(1)} mm nas próximas 3h</span></>}
            Icon={CloudRain}
            label="Chuva"
            tone="blue"
            value={`${data.current.rainChance}%`}
          />
          <WeatherMetricCard
            detail={<><span>Direção: {data.current.windDirection}</span><span>Rajadas até {data.current.windGust} km/h</span></>}
            Icon={Wind}
            label="Vento"
            tone={data.current.windGust >= 30 ? 'amber' : 'green'}
            value={`${data.current.windSpeed} km/h`}
          />
          <WeatherMetricCard
            detail={<span>{data.current.humidity >= 80 ? 'Alta umidade no ar' : 'Umidade em faixa moderada'}</span>}
            Icon={Droplets}
            label="Umidade"
            tone="blue"
            value={`${data.current.humidity}%`}
          />
          <WeatherMetricCard
            detail={<><span>Sensação: {data.current.feelsLike}°C</span><span>{data.current.description}</span></>}
            Icon={Thermometer}
            label="Temperatura"
            value={`${data.current.temperature}°C`}
          />
        </div>
      </div>

      <footer className="radar2-atmosphere-footer">
        <span>Leitura consolidada para {data.farm.name}</span>
        <span>Atualizado às {updatedLabel(data.updatedAt)}</span>
      </footer>
    </article>
  )
}
