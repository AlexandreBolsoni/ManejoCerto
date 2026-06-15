import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSun,
  Radar,
  Satellite,
  Thermometer,
  Wind,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import type { WeatherCondition } from '../../../types/weather'
import type { RadarMapLayer, RadarMapLayerOption, RadarSceneOption } from '../types/radar.types'

export const sceneModes: RadarSceneOption[] = [
  { Icon: Radar, id: 'local', label: 'Radar local' },
  { Icon: Satellite, id: 'satellite', label: 'Satélite' },
  { Icon: Zap, id: 'summary', label: 'Resumo rápido' },
]

export const mapLayers: RadarMapLayerOption[] = [
  { Icon: CloudRain, id: 'rain', label: 'Chuva' },
  { Icon: Cloud, id: 'clouds', label: 'Nuvens' },
  { Icon: Thermometer, id: 'temperature', label: 'Temperatura' },
  { Icon: Wind, id: 'wind', label: 'Vento' },
]

export const conditionIcons: Record<WeatherCondition, LucideIcon> = {
  cloudy: CloudSun,
  fog: CloudFog,
  frost: Thermometer,
  rain: CloudRain,
  storm: CloudLightning,
  sunny: CloudSun,
}

export function iconForLayer(activeLayer: RadarMapLayer) {
  return mapLayers.find((layer) => layer.id === activeLayer)?.Icon ?? CloudRain
}
