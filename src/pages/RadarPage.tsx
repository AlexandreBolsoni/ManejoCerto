import {
  Bell,
  Check,
  CheckCircle2,
  ClipboardList,
  Cloud,
  CloudFog,
  CloudLightning,
  CloudOff,
  CloudRain,
  CloudSun,
  Droplets,
  Info,
  Layers3,
  Radar,
  Satellite,
  ShieldCheck,
  Sparkles,
  Thermometer,
  Timer,
  Wind,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import * as L from 'leaflet'
import { useState } from 'react'
import { Circle, MapContainer, Marker, TileLayer, Tooltip } from 'react-leaflet'
import { Button, LinkButton } from '../components/Button'
import { FarmLocationMarker } from '../components/radar/FarmLocationMarker'
import { RadarEmptyState } from '../components/radar/RadarEmptyState'
import { RadarHeader } from '../components/radar/RadarHeader'
import { APP_STATE_NAME } from '../config/brand'
import { useAppData } from '../hooks/useAppData'
import { useRadarWeather } from '../hooks/useRadarWeather'
import { satelliteService } from '../services/satelliteService'
import type { ForecastHour } from '../types'
import type { RadarWeatherData, RadarWeatherZone, RadarWeatherZoneHour, WeatherCondition } from '../types/weather'

type RadarSceneMode = 'local' | 'satellite' | 'summary'
type RadarMapLayer = 'rain' | 'clouds' | 'temperature' | 'wind'
type TimelineItem = {
  detail: string
  hour?: ForecastHour
  id: string
  label: string
  tileUrl?: string
}

const sceneModes: { Icon: LucideIcon; id: RadarSceneMode; label: string }[] = [
  { Icon: Radar, id: 'local', label: 'Radar local' },
  { Icon: Satellite, id: 'satellite', label: 'Satélite' },
  { Icon: Zap, id: 'summary', label: 'Resumo rápido' },
]

const mapLayers: { Icon: LucideIcon; id: RadarMapLayer; label: string }[] = [
  { Icon: CloudRain, id: 'rain', label: 'Chuva' },
  { Icon: Cloud, id: 'clouds', label: 'Nuvens' },
  { Icon: Thermometer, id: 'temperature', label: 'Temperatura' },
  { Icon: Wind, id: 'wind', label: 'Vento' },
]

const conditionIcons: Record<WeatherCondition, LucideIcon> = {
  cloudy: CloudSun,
  fog: CloudFog,
  frost: Thermometer,
  rain: CloudRain,
  storm: CloudLightning,
  sunny: CloudSun,
}

function updatedTimeLabel(updatedAt?: string) {
  if (!updatedAt) return 'Aguardando leitura'
  return `Atualizado às ${new Date(updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

function hourLabel(time: string) {
  return new Date(time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function rainValue(hour?: ForecastHour) {
  if (!hour) return '0'
  return hour.precipMm < 0.05 ? '0' : hour.precipMm.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function windDirectionLabel(degrees?: number) {
  if (degrees === undefined) return 'variável'
  const directions = ['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO']
  return directions[Math.round(degrees / 45) % directions.length]
}

function weatherCodeCloudCover(code: number, humidityPct: number) {
  if (code === 0) return humidityPct >= 82 ? 45 : 12
  if (code === 1) return 35
  if (code === 2) return 62
  if (code === 3 || code === 45 || code === 48) return 88
  if (code >= 51) return 78
  return clamp(Math.round(humidityPct), 18, 92)
}

function temperatureColor(temperature: number) {
  if (temperature <= 16) return '#3f8fc6'
  if (temperature <= 21) return '#65b9d1'
  if (temperature <= 26) return '#5cae61'
  if (temperature <= 30) return '#e5c83c'
  if (temperature <= 34) return '#e58a2f'
  return '#cf4438'
}

function windColor(speed: number) {
  if (speed < 10) return '#4f8a3c'
  if (speed < 22) return '#7fa34b'
  if (speed < 34) return '#d7a42d'
  return '#c84d37'
}

function rainForecastColor(probabilityPct: number, precipitationMm: number) {
  if (precipitationMm >= 8 || probabilityPct >= 85) return '#8944c7'
  if (precipitationMm >= 4 || probabilityPct >= 70) return '#d83f3f'
  if (precipitationMm >= 1.5 || probabilityPct >= 55) return '#ed9c30'
  if (probabilityPct >= 35) return '#61b95d'
  return '#5ba4ff'
}

function zoneReading(zone: RadarWeatherZone, hourIndex: number): RadarWeatherZoneHour {
  return zone.forecastHours[hourIndex] ?? zone.forecastHours.at(-1) ?? {
    gustKmh: zone.gustKmh,
    humidityPct: zone.humidityPct,
    precipitationMm: zone.precipitationMm,
    rainProbabilityPct: zone.rainProbabilityPct,
    temperatureC: zone.temperatureC,
    weatherCode: zone.weatherCode,
    windDirectionDeg: zone.windDirectionDeg,
    windKmh: zone.windKmh,
  }
}

function forecastAsZoneHour(hour?: ForecastHour, data?: RadarWeatherData): RadarWeatherZoneHour {
  return {
    gustKmh: hour?.gustKmh ?? data?.current.windGust ?? 0,
    humidityPct: hour?.humidityPct ?? data?.current.humidity ?? 0,
    precipitationMm: hour?.precipMm ?? data?.current.rainNext3h ?? 0,
    rainProbabilityPct: hour?.precipProbabilityPct ?? data?.current.rainChance ?? 0,
    temperatureC: hour?.temperatureC ?? data?.current.temperature ?? 0,
    weatherCode: hour?.weatherCode ?? 0,
    windDirectionDeg: hour?.windDirectionDeg ?? 270,
    windKmh: hour?.windKmh ?? data?.current.windSpeed ?? 0,
  }
}

function zoneRadius(zone: RadarWeatherZone) {
  return clamp(zone.radiusM * 0.34, 24000, 180000)
}

function timelineItemsForLayer(activeLayer: RadarMapLayer, data: RadarWeatherData, hours: ForecastHour[]) {
  if (activeLayer === 'rain' && data.mapLayers.rainFrames?.length) {
    return data.mapLayers.rainFrames.slice(-6).map<TimelineItem>((frame) => ({
      detail: frame.type === 'nowcast' ? 'previsto' : 'observado',
      id: `rain:${frame.time}`,
      label: new Date(frame.time * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      tileUrl: frame.tileUrl,
    }))
  }

  return hours.slice(0, 6).map<TimelineItem>((hour) => ({
    detail: `${rainValue(hour)} mm · ${Math.round(hour.precipProbabilityPct)}% chuva`,
    hour,
    id: `forecast:${hour.time}`,
    label: hourLabel(hour.time),
  }))
}

function layerChipText(activeLayer: RadarMapLayer, selectedTimeline: TimelineItem | undefined, selectedReading: RadarWeatherZoneHour) {
  if (activeLayer === 'rain') {
    if (selectedTimeline?.tileUrl) return `Radar ${selectedTimeline.detail} · ${selectedTimeline.label}`
    return `${rainValue(selectedTimeline?.hour)} mm · ${Math.round(selectedReading.rainProbabilityPct)}% chuva`
  }
  if (activeLayer === 'temperature') {
    return `${Math.round(selectedReading.temperatureC)}°C · ${Math.round(selectedReading.humidityPct)}% UR`
  }
  if (activeLayer === 'wind') {
    return `${Math.round(selectedReading.windKmh)} km/h · ${windDirectionLabel(selectedReading.windDirectionDeg)}`
  }
  return `${weatherCodeCloudCover(selectedReading.weatherCode, selectedReading.humidityPct)}% cobertura estimada`
}

function windMarkerIcon(reading: RadarWeatherZoneHour) {
  const color = windColor(reading.windKmh)
  const rotation = Math.round((reading.windDirectionDeg ?? 270) + 90)

  return L.divIcon({
    className: 'radar-climate-wind-marker',
    html: `<span style="--wind-color:${color};--wind-rotation:${rotation}deg">&rarr;</span><strong>${Math.round(reading.windKmh)}</strong>`,
    iconAnchor: [24, 24],
    iconSize: [48, 48],
  })
}

function operationalConfidence(data: RadarWeatherData) {
  const rainPenalty = Math.min(data.current.rainChance, 70)
  const windPenalty = Math.min(data.current.windGust * 1.4, 35)
  return Math.max(42, Math.round(96 - rainPenalty * 0.45 - windPenalty * 0.35))
}

function operationalTitle(data: RadarWeatherData) {
  if (data.status.level === 'critical' || data.status.level === 'alert') return 'Atenção nas próximas horas'
  if (data.current.rainChance >= 45 || data.current.windGust >= 30) return 'Monitorar antes de operar'
  return 'Boa nas próximas 2h'
}

function quickInsights(data: RadarWeatherData) {
  return [
    data.status.level === 'stable' ? 'Sem núcleo intenso sobre a fazenda no momento.' : data.status.detail,
    data.current.rainChance >= 45 ? 'Maior instabilidade próxima da área monitorada.' : 'Maior instabilidade ao norte do estado.',
    data.current.windGust >= 30 ? 'Rajadas podem afetar operações sensíveis.' : 'Baixo risco imediato para operação no campo.',
  ]
}

function decisionItems(data: RadarWeatherData) {
  return [
    data.current.rainChance >= 45 ? 'Monitorar borda de instabilidade antes da operação.' : 'Monitorar borda norte da área.',
    data.recommendations.spraying.status === 'not_recommended'
      ? `Evitar pulverização: ${data.recommendations.spraying.reason}.`
      : 'Pulverização possível se o vento permanecer baixo.',
    data.recommendations.irrigation.status === 'not_needed'
      ? `Irrigação não necessária: ${data.recommendations.irrigation.reason}.`
      : 'Acompanhar atualização do radar nas próximas leituras.',
  ]
}

function RadarSceneControl({
  activeMode,
  onChange,
}: {
  activeMode: RadarSceneMode
  onChange: (mode: RadarSceneMode) => void
}) {
  return (
    <div className="radar-climate-scene-control" aria-label="Modo do radar">
      {sceneModes.map(({ Icon, id, label }) => (
        <button className={activeMode === id ? 'active' : ''} key={id} onClick={() => onChange(id)} type="button">
          <Icon size={18} aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  )
}

function RadarLayerButtons({
  activeLayer,
  onChange,
}: {
  activeLayer: RadarMapLayer
  onChange: (layer: RadarMapLayer) => void
}) {
  return (
    <div className="radar-climate-layer-buttons" aria-label="Camada do mapa">
      {mapLayers.map(({ Icon, id, label }) => (
        <button className={activeLayer === id ? 'active' : ''} key={id} onClick={() => onChange(id)} type="button">
          <Icon size={16} aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  )
}

function RadarLayerLegend({ activeLayer, hasRainTile }: { activeLayer: RadarMapLayer; hasRainTile: boolean }) {
  const meta: Record<RadarMapLayer, { gradient: string; labels: string[]; note: string; title: string }> = {
    clouds: {
      gradient: 'linear-gradient(90deg, rgba(255,255,255,0.18), #d7dddd, #8b989d)',
      labels: ['poucas', 'muitas'],
      note: 'Estimativa por umidade e código meteorológico',
      title: 'Cobertura de nuvens',
    },
    rain: {
      gradient: 'linear-gradient(90deg, #9bd9ff, #5ba4ff, #5bc266, #f2df4c, #ef982f, #d93f3f, #8b44c7)',
      labels: ['fraca', 'forte'],
      note: hasRainTile ? 'Tile RainViewer, escala visual do radar' : 'Sem tile: usando previsão Open-Meteo',
      title: 'Intensidade da chuva',
    },
    temperature: {
      gradient: 'linear-gradient(90deg, #3f8fc6, #65b9d1, #5cae61, #e5c83c, #e58a2f, #cf4438)',
      labels: ['frio', 'quente'],
      note: 'Zonas por temperatura horária prevista',
      title: 'Temperatura',
    },
    wind: {
      gradient: 'linear-gradient(90deg, #4f8a3c, #7fa34b, #d7a42d, #c84d37)',
      labels: ['0 km/h', '40+ km/h'],
      note: 'Seta indica fluxo do vento; número em km/h',
      title: 'Vento',
    },
  }
  const layer = meta[activeLayer]

  return (
    <div className={`radar-climate-layer-legend ${activeLayer}`}>
      <strong>{layer.title}</strong>
      <i aria-hidden="true" style={{ background: layer.gradient }} />
      <span>
        {layer.labels.map((label) => (
          <small key={label}>{label}</small>
        ))}
      </span>
      <em>{layer.note}</em>
    </div>
  )
}

function RadarDataLayer({
  activeLayer,
  data,
  hasRainTile,
  selectedHour,
  selectedHourIndex,
}: {
  activeLayer: RadarMapLayer
  data: RadarWeatherData
  hasRainTile: boolean
  selectedHour?: ForecastHour
  selectedHourIndex: number
}) {
  const localReading = forecastAsZoneHour(selectedHour, data)
  const zones = data.mapLayers.zones

  if (activeLayer === 'rain' && hasRainTile) return null

  if (activeLayer === 'wind') {
    return (
      <>
        {zones.map((zone) => {
          const reading = zoneReading(zone, selectedHourIndex)
          return (
            <Marker icon={windMarkerIcon(reading)} key={`wind:${zone.id}`} position={[zone.latitude, zone.longitude]} zIndexOffset={620}>
              <Tooltip direction="top" opacity={1}>
                <strong>{zone.label}</strong>
                <br />
                Vento {Math.round(reading.windKmh)} km/h · rajada {Math.round(reading.gustKmh)} km/h · {windDirectionLabel(reading.windDirectionDeg)}
              </Tooltip>
            </Marker>
          )
        })}
        <Marker icon={windMarkerIcon(localReading)} position={[data.farm.latitude, data.farm.longitude]} zIndexOffset={650}>
          <Tooltip direction="top" opacity={1}>
            <strong>{data.farm.name}</strong>
            <br />
            Vento {Math.round(localReading.windKmh)} km/h · rajada {Math.round(localReading.gustKmh)} km/h
          </Tooltip>
        </Marker>
      </>
    )
  }

  if (activeLayer === 'temperature') {
    return (
      <>
        {zones.map((zone) => {
          const reading = zoneReading(zone, selectedHourIndex)
          const color = temperatureColor(reading.temperatureC)
          return (
            <Circle
              center={[zone.latitude, zone.longitude]}
              key={`temp:${zone.id}`}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.32, opacity: 0.78, weight: 1.4 }}
              radius={zoneRadius(zone)}
            >
              <Tooltip sticky>
                <strong>{Math.round(reading.temperatureC)}°C</strong>
                <br />
                {zone.label} · {Math.round(reading.humidityPct)}% UR
              </Tooltip>
            </Circle>
          )
        })}
        <Circle
          center={[data.farm.latitude, data.farm.longitude]}
          pathOptions={{
            color: temperatureColor(localReading.temperatureC),
            fillColor: temperatureColor(localReading.temperatureC),
            fillOpacity: 0.42,
            opacity: 0.9,
            weight: 2,
          }}
          radius={36000}
        />
      </>
    )
  }

  if (activeLayer === 'clouds') {
    return (
      <>
        {zones.map((zone) => {
          const reading = zoneReading(zone, selectedHourIndex)
          const cover = weatherCodeCloudCover(reading.weatherCode, reading.humidityPct)
          const opacity = clamp(0.16 + cover / 180, 0.18, 0.64)
          return (
            <Circle
              center={[zone.latitude, zone.longitude]}
              key={`cloud:${zone.id}`}
              pathOptions={{ color: '#7e8b91', fillColor: '#d8dddd', fillOpacity: opacity, opacity: 0.36, weight: 1 }}
              radius={zoneRadius(zone)}
            >
              <Tooltip sticky>
                <strong>{cover}% nuvens</strong>
                <br />
                {zone.label} · {Math.round(reading.humidityPct)}% UR
              </Tooltip>
            </Circle>
          )
        })}
        <Circle
          center={[data.farm.latitude, data.farm.longitude]}
          pathOptions={{ color: '#7e8b91', fillColor: '#d8dddd', fillOpacity: 0.3, opacity: 0.46, weight: 1.4 }}
          radius={42000}
        />
      </>
    )
  }

  return (
    <>
      {zones.map((zone) => {
        const reading = zoneReading(zone, selectedHourIndex)
        if (reading.rainProbabilityPct < 25 && reading.precipitationMm < 0.1) return null
        const color = rainForecastColor(reading.rainProbabilityPct, reading.precipitationMm)
        return (
          <Circle
            center={[zone.latitude, zone.longitude]}
            key={`rain:${zone.id}`}
            pathOptions={{ color, fillColor: color, fillOpacity: 0.28, opacity: 0.72, weight: 1.5 }}
            radius={zoneRadius(zone)}
          >
            <Tooltip sticky>
              <strong>{Math.round(reading.rainProbabilityPct)}% chuva</strong>
              <br />
              {reading.precipitationMm.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mm · {zone.label}
            </Tooltip>
          </Circle>
        )
      })}
    </>
  )
}

function RadarMapPanel({
  activeHour,
  activeLayer,
  data,
  hours,
  loading,
  mode,
  onHourChange,
  onLayerChange,
  regionLabel,
}: {
  activeHour: number
  activeLayer: RadarMapLayer
  data: RadarWeatherData
  hours: ForecastHour[]
  loading: boolean
  mode: RadarSceneMode
  onHourChange: (index: number) => void
  onLayerChange: (layer: RadarMapLayer) => void
  regionLabel: string
}) {
  const satellite = satelliteService.getLayerInfo()
  const center: [number, number] = [data.farm.latitude, data.farm.longitude]
  const isSatellite = mode === 'satellite'
  const timelineItems = timelineItemsForLayer(activeLayer, data, hours)
  const selectedTimelineIndex = Math.min(activeHour, Math.max(timelineItems.length - 1, 0))
  const selectedTimeline = timelineItems[selectedTimelineIndex]
  const selectedForecastHour = selectedTimeline?.hour ?? hours[selectedTimelineIndex] ?? hours[0]
  const selectedReading = forecastAsZoneHour(selectedForecastHour, data)
  const rainTileUrl = activeLayer === 'rain' ? selectedTimeline?.tileUrl ?? data.mapLayers.rainTileUrl : undefined
  const hasRainTile = Boolean(rainTileUrl)
  const ActiveLayerIcon = mapLayers.find((layer) => layer.id === activeLayer)?.Icon ?? CloudRain

  return (
    <section className="radar-climate-map-card">
      <header>
        <div>
          <ActiveLayerIcon size={21} aria-hidden="true" />
          <strong>{activeLayer === 'rain' ? `Radar de chuva · ${regionLabel}` : `${mapLayers.find((layer) => layer.id === activeLayer)?.label} · ${regionLabel}`}</strong>
        </div>
        <RadarLayerButtons activeLayer={activeLayer} onChange={onLayerChange} />
      </header>

      <div className={`radar-climate-map-stage mode-${mode} layer-${activeLayer}`}>
        <MapContainer center={center} className="radar-climate-leaflet-map" scrollWheelZoom zoom={8}>
          {isSatellite ? (
            <TileLayer maxNativeZoom={satellite.maxNativeZoom} url={satellite.tileUrl} />
          ) : (
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
          )}
          {!isSatellite && activeLayer === 'clouds' ? <TileLayer maxNativeZoom={satellite.maxNativeZoom} opacity={0.22} url={satellite.tileUrl} /> : null}
          {activeLayer === 'rain' && rainTileUrl ? <TileLayer maxNativeZoom={7} maxZoom={7} opacity={0.62} url={rainTileUrl} zIndex={430} /> : null}
          <RadarDataLayer
            activeLayer={activeLayer}
            data={data}
            hasRainTile={hasRainTile}
            selectedHour={selectedForecastHour}
            selectedHourIndex={selectedTimelineIndex}
          />
          <FarmLocationMarker farm={data.farm} />
        </MapContainer>

        {mode === 'summary' ? (
          <aside className="radar-climate-summary-overlay">
            <Sparkles size={20} aria-hidden="true" />
            <strong>{data.interpretation.title}</strong>
            <p>{data.interpretation.summary}</p>
          </aside>
        ) : null}

        <RadarLayerLegend activeLayer={activeLayer} hasRainTile={hasRainTile} />

        <div className="radar-climate-timeline" aria-label="Linha do tempo da previsão">
          {timelineItems.map((item, index) => (
            <button className={selectedTimelineIndex === index ? 'active' : ''} key={item.id} onClick={() => onHourChange(index)} type="button">
              <span>{item.label}</span>
              <small>{item.detail}</small>
            </button>
          ))}
        </div>

        <div className="radar-climate-hour-chip">
          {layerChipText(activeLayer, selectedTimeline, selectedReading)}
        </div>

        {loading ? <div className="radar-climate-loading">Atualizando radar...</div> : null}
      </div>
    </section>
  )
}

function NowCard({ data }: { data: RadarWeatherData }) {
  const CurrentIcon = conditionIcons[data.current.condition] ?? CloudSun

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

function QuickReadingCard({ data }: { data: RadarWeatherData }) {
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

function ActiveLayersCard({
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

function OperationalWindowCard({ data }: { data: RadarWeatherData }) {
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

function SixHourForecastCard({ hours }: { hours: ForecastHour[] }) {
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

function LocalAlertsCard({ data }: { data: RadarWeatherData }) {
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

function DecisionSummaryCard({ data }: { data: RadarWeatherData }) {
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

export function RadarPage() {
  const { activeFieldId, climate, farm, fields, setActiveFieldId, weatherLocation } = useAppData()
  const { data, error, isCached, isOnline, loading, refresh, visualLoading } = useRadarWeather()
  const [mode, setMode] = useState<RadarSceneMode>('local')
  const [activeLayer, setActiveLayer] = useState<RadarMapLayer>('rain')
  const [activeHour, setActiveHour] = useState(3)

  const forecastFromClimate = climate?.weather.forecastHours?.slice(0, 7) ?? []
  const hours = forecastFromClimate
  const fallbackBaseTime = data?.updatedAt ?? climate?.weather.forecastHours?.[0]?.time ?? '1970-01-01T00:00:00.000Z'
  const fallbackBaseMs = new Date(fallbackBaseTime).getTime()
  const regionLabel = data?.farm.state && data.farm.state.length > 2 ? data.farm.state : APP_STATE_NAME
  const safeHours = hours.length > 0 ? hours : Array.from({ length: 7 }, (_, index) => ({
    et0Mm: 0,
    gustKmh: data?.current.windGust ?? 0,
    humidityPct: data?.current.humidity ?? 0,
    precipMm: index === 2 ? data?.current.rainNext3h ?? 0 : 0,
    precipProbabilityPct: data?.current.rainChance ?? 0,
    temperatureC: data?.current.temperature ?? 0,
    time: new Date(fallbackBaseMs + index * 60 * 60 * 1000).toISOString(),
    weatherCode: 1,
    windDirectionDeg: undefined,
    windKmh: data?.current.windSpeed ?? 0,
  }))
  const selectedHour = Math.min(activeHour, safeHours.length - 1)

  return (
    <section className="radar2-page radar-climate-page">
      <RadarHeader
        activeFieldId={activeFieldId}
        data={data}
        fields={fields}
        loading={loading || visualLoading}
        onFieldChange={setActiveFieldId}
        onRefresh={() => void refresh()}
      />

      {!farm || !weatherLocation ? (
        <RadarEmptyState action={<LinkButton to="/fazenda/nova">Cadastrar localização</LinkButton>} kind="no-location" />
      ) : loading ? (
        <RadarEmptyState kind="loading" />
      ) : data ? (
        <>
          {isCached || !isOnline ? (
            <div className="radar2-data-notice">
              <CloudOff size={17} aria-hidden="true" />
              <span><strong>Exibindo a última leitura salva.</strong> Atualizaremos assim que houver conexão.</span>
            </div>
          ) : error ? (
            <div className="radar2-data-notice warning">
              <CloudOff size={17} aria-hidden="true" />
              <span><strong>Algumas camadas não atualizaram.</strong> A leitura da fazenda continua disponível.</span>
            </div>
          ) : null}

          <RadarSceneControl activeMode={mode} onChange={setMode} />

          <div className="radar-climate-layout">
            <RadarMapPanel
              activeHour={selectedHour}
              activeLayer={activeLayer}
              data={data}
              hours={safeHours.slice(0, 5)}
              loading={visualLoading}
              mode={mode}
              onHourChange={setActiveHour}
              onLayerChange={setActiveLayer}
              regionLabel={regionLabel}
            />
            <aside className="radar-climate-side">
              <NowCard data={data} />
              <QuickReadingCard data={data} />
              <ActiveLayersCard activeLayer={activeLayer} mode={mode} onLayerChange={setActiveLayer} onModeChange={setMode} />
              <OperationalWindowCard data={data} />
            </aside>
            <SixHourForecastCard hours={safeHours.slice(0, 7)} />
            <LocalAlertsCard data={data} />
            <DecisionSummaryCard data={data} />
          </div>
        </>
      ) : (
        <RadarEmptyState action={<Button onClick={() => void refresh()}>Tentar novamente</Button>} kind={isOnline ? 'error' : 'offline'} />
      )}
    </section>
  )
}
