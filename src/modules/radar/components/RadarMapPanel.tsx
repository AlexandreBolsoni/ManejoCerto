import { Cloud, CloudRain, Sparkles, Thermometer, Wind } from 'lucide-react'
import * as L from 'leaflet'
import { Circle, MapContainer, Marker, TileLayer, Tooltip } from 'react-leaflet'
import { FarmLocationMarker } from '../../../components/radar/FarmLocationMarker'
import { satelliteService } from '../../../services/satelliteService'
import type { ForecastHour } from '../../../types'
import type { RadarWeatherData, RadarWeatherZoneHour } from '../../../types/weather'
import type { RadarMapLayer, RadarSceneMode } from '../types/radar.types'
import { mapLayers } from '../utils/radarOptions'
import {
  clamp,
  forecastAsZoneHour,
  layerChipText,
  rainForecastColor,
  temperatureColor,
  timelineItemsForLayer,
  weatherCodeCloudCover,
  windColor,
  windDirectionLabel,
  zoneRadius,
  zoneReading,
} from '../utils/radarView'

export type RadarMapPanelProps = {
  activeHour: number
  activeLayer: RadarMapLayer
  data: RadarWeatherData
  hours: ForecastHour[]
  loading: boolean
  mode: RadarSceneMode
  onHourChange: (index: number) => void
  onLayerChange: (layer: RadarMapLayer) => void
  regionLabel: string
}

export function RadarMapPanel({
  activeHour,
  activeLayer,
  data,
  hours,
  loading,
  mode,
  onHourChange,
  onLayerChange,
  regionLabel,
}: RadarMapPanelProps) {
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

  return (
    <section className="radar-climate-map-card">
      <header>
        <div>
          <ActiveLayerIcon layer={activeLayer} />
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

function ActiveLayerIcon({ layer }: { layer: RadarMapLayer }) {
  if (layer === 'clouds') return <Cloud size={21} aria-hidden="true" />
  if (layer === 'temperature') return <Thermometer size={21} aria-hidden="true" />
  if (layer === 'wind') return <Wind size={21} aria-hidden="true" />
  return <CloudRain size={21} aria-hidden="true" />
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
