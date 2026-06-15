import type { ForecastHour } from '../../../types'
import type { RadarWeatherData, RadarWeatherZone, RadarWeatherZoneHour } from '../../../types/weather'
import type { RadarMapLayer, TimelineItem } from '../types/radar.types'

export function updatedTimeLabel(updatedAt?: string) {
  if (!updatedAt) return 'Aguardando leitura'
  return `Atualizado às ${new Date(updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

export function hourLabel(time: string) {
  return new Date(time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function rainValue(hour?: ForecastHour) {
  if (!hour) return '0'
  return hour.precipMm < 0.05 ? '0' : hour.precipMm.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function windDirectionLabel(degrees?: number) {
  if (degrees === undefined) return 'variável'
  const directions = ['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO']
  return directions[Math.round(degrees / 45) % directions.length]
}

export function weatherCodeCloudCover(code: number, humidityPct: number) {
  if (code === 0) return humidityPct >= 82 ? 45 : 12
  if (code === 1) return 35
  if (code === 2) return 62
  if (code === 3 || code === 45 || code === 48) return 88
  if (code >= 51) return 78
  return clamp(Math.round(humidityPct), 18, 92)
}

export function temperatureColor(temperature: number) {
  if (temperature <= 16) return '#3f8fc6'
  if (temperature <= 21) return '#65b9d1'
  if (temperature <= 26) return '#5cae61'
  if (temperature <= 30) return '#e5c83c'
  if (temperature <= 34) return '#e58a2f'
  return '#cf4438'
}

export function windColor(speed: number) {
  if (speed < 10) return '#4f8a3c'
  if (speed < 22) return '#7fa34b'
  if (speed < 34) return '#d7a42d'
  return '#c84d37'
}

export function rainForecastColor(probabilityPct: number, precipitationMm: number) {
  if (precipitationMm >= 8 || probabilityPct >= 85) return '#8944c7'
  if (precipitationMm >= 4 || probabilityPct >= 70) return '#d83f3f'
  if (precipitationMm >= 1.5 || probabilityPct >= 55) return '#ed9c30'
  if (probabilityPct >= 35) return '#61b95d'
  return '#5ba4ff'
}

export function zoneReading(zone: RadarWeatherZone, hourIndex: number): RadarWeatherZoneHour {
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

export function forecastAsZoneHour(hour?: ForecastHour, data?: RadarWeatherData): RadarWeatherZoneHour {
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

export function zoneRadius(zone: RadarWeatherZone) {
  return clamp(zone.radiusM * 0.34, 24000, 180000)
}

export function timelineItemsForLayer(activeLayer: RadarMapLayer, data: RadarWeatherData, hours: ForecastHour[]) {
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

export function layerChipText(activeLayer: RadarMapLayer, selectedTimeline: TimelineItem | undefined, selectedReading: RadarWeatherZoneHour) {
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

export function operationalConfidence(data: RadarWeatherData) {
  const rainPenalty = Math.min(data.current.rainChance, 70)
  const windPenalty = Math.min(data.current.windGust * 1.4, 35)
  return Math.max(42, Math.round(96 - rainPenalty * 0.45 - windPenalty * 0.35))
}

export function operationalTitle(data: RadarWeatherData) {
  if (data.status.level === 'critical' || data.status.level === 'alert') return 'Atenção nas próximas horas'
  if (data.current.rainChance >= 45 || data.current.windGust >= 30) return 'Monitorar antes de operar'
  return 'Boa nas próximas 2h'
}

export function quickInsights(data: RadarWeatherData) {
  return [
    data.status.level === 'stable' ? 'Sem núcleo intenso sobre a fazenda no momento.' : data.status.detail,
    data.current.rainChance >= 45 ? 'Maior instabilidade próxima da área monitorada.' : 'Maior instabilidade ao norte do estado.',
    data.current.windGust >= 30 ? 'Rajadas podem afetar operações sensíveis.' : 'Baixo risco imediato para operação no campo.',
  ]
}

export function decisionItems(data: RadarWeatherData) {
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
