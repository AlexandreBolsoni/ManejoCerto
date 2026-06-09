import { Layers3, MapPin, Radio, Wind } from 'lucide-react'
import { useEffect } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import type { RadarWeatherData } from '../../types/weather'
import { satelliteService } from '../../services/satelliteService'
import { FarmLocationMarker } from './FarmLocationMarker'
import { WeatherIconLayer } from './WeatherIconLayer'
import { WeatherMapLayer } from './WeatherMapLayer'

function NationalView() {
  const map = useMap()

  useEffect(() => {
    const update = () => map.setView([-15.5, -52.5], map.getSize().x < 600 ? 3 : 4, { animate: false })
    update()
    map.on('resize', update)
    return () => {
      map.off('resize', update)
    }
  }, [map])

  return null
}

export function TvWeatherMap({ data, loading }: { data: RadarWeatherData; loading: boolean }) {
  const satellite = satelliteService.getLayerInfo()

  return (
    <section className="radar2-map-card" aria-label="Mapa meteorológico ilustrado do Brasil">
      <header className="radar2-map-toolbar">
        <div>
          <span className="radar2-live-dot" />
          <strong>Leitura meteorológica nacional</strong>
          <small>Visão didática para decisão agrícola</small>
        </div>
        <div className="radar2-map-badges">
          <span><Radio size={14} aria-hidden="true" /> Chuva atual</span>
          <span><Wind size={14} aria-hidden="true" /> Sistemas</span>
          <span><Layers3 size={14} aria-hidden="true" /> Massas de ar</span>
        </div>
      </header>
      <div className="radar2-map-stage">
        <MapContainer
          attributionControl={false}
          center={[-15.5, -52.5]}
          className="radar2-leaflet-map"
          doubleClickZoom={false}
          dragging={false}
          keyboard={false}
          maxZoom={4}
          minZoom={3}
          scrollWheelZoom={false}
          zoom={4}
          zoomControl={false}
        >
          <NationalView />
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          <TileLayer maxNativeZoom={satellite.maxNativeZoom} opacity={0.22} url={satellite.tileUrl} zIndex={220} />
          {data.mapLayers.rainTileUrl ? (
            <TileLayer maxNativeZoom={7} maxZoom={7} opacity={0.48} url={data.mapLayers.rainTileUrl} zIndex={430} />
          ) : null}
          <FarmLocationMarker farm={data.farm} />
        </MapContainer>
        <WeatherMapLayer arrows={data.tvMap.arrows} zones={data.tvMap.zones} />
        <WeatherIconLayer icons={data.tvMap.icons} />
        <aside className="radar2-farm-callout">
          <MapPin size={16} aria-hidden="true" />
          <span>
            <small>Sua localização</small>
            <strong>{data.farm.name}</strong>
          </span>
        </aside>
        <aside className={`radar2-map-status ${data.status.level}`}>
          <span>{data.status.label}</span>
          <strong>{data.current.temperature}°C</strong>
          <small>{data.current.description} · {data.current.rainChance}% chuva</small>
        </aside>
        {loading ? <div className="radar2-map-loading">Atualizando camadas climáticas...</div> : null}
      </div>
      <footer className="radar2-map-footer">
        <span>Mapa ilustrativo com previsão, satélite e radar visual</span>
        <span>Direção dos sistemas indicada pelas setas</span>
      </footer>
    </section>
  )
}
