import type { ClimateDashboard } from '../climateService'
import type { Alert, Farm, ForecastHour } from '../../types'
import type { WeatherZone, WeatherZoneKind } from '../weatherZoneService'
import type {
  IrrigationStatus,
  RadarWeatherData,
  RadarWeatherZone,
  RainIntensity,
  SprayingStatus,
  WeatherCondition,
  WeatherIconType,
  WeatherRegion,
  WeatherRiskLevel,
  WeatherStatus,
} from '../../types/weather'

function maxOf(hours: ForecastHour[], selector: (hour: ForecastHour) => number, fallback = 0) {
  return Math.max(...hours.map(selector), fallback)
}

function minOf(hours: ForecastHour[], selector: (hour: ForecastHour) => number, fallback = 0) {
  return Math.min(...hours.map(selector), fallback)
}

function sumOf(hours: ForecastHour[], selector: (hour: ForecastHour) => number) {
  return hours.reduce((total, hour) => total + selector(hour), 0)
}

function riskLevel(score: number): WeatherRiskLevel {
  if (score >= 70) return 'high'
  if (score >= 38) return 'moderate'
  return 'low'
}

function alertRisk(alert: Alert): WeatherRiskLevel {
  if (alert.severity === 'critico' || alert.severity === 'alto') return 'high'
  if (alert.severity === 'moderado') return 'moderate'
  return 'low'
}

function conditionFromCode(code: number, temperature: number): WeatherCondition {
  if (temperature <= 4) return 'frost'
  if ([95, 96, 99].includes(code)) return 'storm'
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'rain'
  if ([45, 48].includes(code)) return 'fog'
  if ([1, 2, 3].includes(code)) return 'cloudy'
  return 'sunny'
}

function rainIntensity(rain3h: number, maxCode: number): RainIntensity {
  if (maxCode >= 95) return 'storm'
  if (rain3h >= 15) return 'heavy'
  if (rain3h >= 5) return 'moderate'
  if (rain3h >= 0.2) return 'light'
  return 'none'
}

function weatherStatus(storm: WeatherRiskLevel, heavyRain: WeatherRiskLevel, rainChance: number): RadarWeatherData['status'] {
  let level: WeatherStatus = 'stable'
  if (storm === 'high') level = 'critical'
  else if (heavyRain === 'high') level = 'alert'
  else if (storm === 'moderate' || heavyRain === 'moderate') level = 'unstable'
  else if (rainChance >= 45) level = 'attention'

  const labels: Record<WeatherStatus, string> = {
    stable: 'Tempo estável',
    attention: 'Atenção',
    unstable: 'Tempo instável',
    alert: 'Alerta climático',
    critical: 'Condição crítica',
  }
  const details: Record<WeatherStatus, string> = {
    stable: 'Sem evento climático relevante nas próximas horas.',
    attention: 'Há mudança de tempo possível nas próximas horas.',
    unstable: 'Chuva ou vento podem afetar operações no campo.',
    alert: 'Condições adversas podem atingir a região da fazenda.',
    critical: 'Evento severo exige atenção imediata.',
  }

  return { level, label: labels[level], detail: details[level] }
}

function sprayingRecommendation(rainChance: number, windSpeed: number, windGust: number, humidity: number, storm: WeatherRiskLevel) {
  let status: SprayingStatus = 'recommended'
  const reasons: string[] = []

  if (storm === 'high' || rainChance >= 65 || windSpeed >= 18 || windGust >= 30) status = 'not_recommended'
  else if (storm === 'moderate' || rainChance >= 35 || windSpeed >= 13 || humidity >= 88) status = 'attention'

  if (windSpeed >= 18 || windGust >= 30) reasons.push('vento acima da faixa ideal')
  if (rainChance >= 65) reasons.push('chuva provável nas próximas horas')
  if (storm !== 'low') reasons.push('risco de tempestade')
  if (humidity >= 88) reasons.push('umidade muito alta')
  if (reasons.length === 0) reasons.push('vento e chuva dentro da faixa operacional')

  return { status, reason: reasons.join(' e ') }
}

function irrigationRecommendation(rain24h: number, rainChance: number, humidity: number, et0: number) {
  let status: IrrigationStatus = 'moderate_need'
  let reason = 'demanda hídrica moderada; acompanhe a umidade do solo'

  if (rain24h >= 8 || rainChance >= 70) {
    status = 'not_needed'
    reason = 'chuva prevista deve atender a demanda hídrica imediata'
  } else if (rain24h >= 3 || rainChance >= 45 || humidity >= 82) {
    status = 'low_need'
    reason = 'umidade alta e possibilidade de chuva reduzem a necessidade'
  } else if (et0 >= 4.5 && rain24h < 1) {
    status = 'high_need'
    reason = 'demanda hídrica elevada e pouca chuva prevista'
  }

  return { status, reason }
}

function regionForZone(zone: WeatherZone): WeatherRegion {
  if (zone.label.includes('Nordeste')) return 'northeast'
  if (zone.label.includes('Centro-Oeste')) return 'centerwest'
  if (zone.label.includes('Sudeste')) return 'southeast'
  if (zone.label.includes('Sul')) return 'south'
  return 'north'
}

function zoneIntensity(zone: WeatherZone): WeatherRiskLevel {
  if (zone.kind === 'storm' || zone.gustKmh >= 55 || zone.rainProbabilityPct >= 80) return 'high'
  if (zone.kind === 'rain' || zone.gustKmh >= 35 || zone.rainProbabilityPct >= 55) return 'moderate'
  return 'low'
}

function mapZone(zone: WeatherZone): RadarWeatherZone {
  return {
    id: zone.id,
    region: regionForZone(zone),
    type: zone.kind,
    label: zone.label,
    detail: zone.detail,
    latitude: zone.latitude,
    longitude: zone.longitude,
    radiusM: zone.radiusM,
    color: zone.color,
    intensity: zoneIntensity(zone),
    temperatureC: zone.temperatureC,
    humidityPct: zone.humidityPct,
    precipitationMm: zone.precipitationMm,
    weatherCode: zone.weatherCode,
    windKmh: zone.windKmh,
    gustKmh: zone.gustKmh,
    windDirectionDeg: zone.windDirectionDeg,
    rainProbabilityPct: zone.rainProbabilityPct,
    forecastHours: zone.forecastHours,
  }
}

function iconFromZone(kind: WeatherZoneKind): WeatherIconType {
  if (kind === 'storm') return 'storm'
  if (kind === 'rain') return 'rain'
  if (kind === 'cold') return 'frost'
  if (kind === 'cloud') return 'cloud'
  if (kind === 'stable' || kind === 'heat' || kind === 'dry') return 'sun'
  return 'wind'
}

function windDirection(degrees?: number) {
  if (degrees === undefined) return 'variável'
  const directions = ['Norte', 'Nordeste', 'Leste', 'Sudeste', 'Sul', 'Sudoeste', 'Oeste', 'Noroeste']
  return directions[Math.round(degrees / 45) % directions.length]
}

function interpretation(
  status: RadarWeatherData['status'],
  rainChance: number,
  rainIntensityValue: RainIntensity,
  windDirection: string,
  spraying: RadarWeatherData['recommendations']['spraying'],
) {
  const rainText =
    rainIntensityValue === 'storm'
      ? 'tempestade'
      : rainIntensityValue === 'heavy'
        ? 'chuva forte'
        : rainIntensityValue === 'moderate'
          ? 'chuva moderada'
          : rainIntensityValue === 'light'
            ? 'chuva fraca'
            : 'pouca chance de chuva'

  return {
    title: status.level === 'stable' ? 'Cenário favorável para o campo' : 'Mudança de tempo na região',
    summary: `${status.detail} A leitura indica ${rainText}, com ${Math.round(rainChance)}% de chance nas próximas horas. O vento predominante vem de ${windDirection.toLowerCase()}.`,
    recommendation:
      spraying.status === 'recommended'
        ? 'A pulverização está em uma janela favorável, mas confirme as condições no talhão.'
        : spraying.status === 'attention'
          ? `Pulverize com atenção: ${spraying.reason}.`
          : `Evite pulverização agora: ${spraying.reason}.`,
  }
}

export function mapClimateToRadarWeather({
  climate,
  farm,
  rainFrames,
  rainTileUrl,
  zones,
}: {
  climate: ClimateDashboard
  farm: Farm
  rainFrames?: RadarWeatherData['mapLayers']['rainFrames']
  rainTileUrl?: string
  zones: WeatherZone[]
}): RadarWeatherData {
  const hours = climate.weather.forecastHours ?? []
  const next3h = hours.slice(0, 3)
  const next24h = hours.slice(0, 24)
  const first = hours[0]
  const temperature = climate.weather.current.temperatureC
  const humidity = Math.round(climate.station?.humidityPct ?? first?.humidityPct ?? 0)
  const windSpeed = Math.round(climate.station?.windKmh ?? first?.windKmh ?? 0)
  const windGust = Math.round(climate.station?.gustKmh ?? maxOf(next3h, (hour) => hour.gustKmh))
  const rainChance = Math.round(maxOf(next3h, (hour) => hour.precipProbabilityPct))
  const rainNext3h = Number(sumOf(next3h, (hour) => hour.precipMm).toFixed(1))
  const rain24h = sumOf(next24h, (hour) => hour.precipMm)
  const maxCode = maxOf(next3h, (hour) => hour.weatherCode)
  const minTemp = minOf(hours.slice(0, 72), (hour) => hour.temperatureC, temperature)
  const minHumidity = minOf(next24h, (hour) => hour.humidityPct, humidity)
  const maxGust24h = maxOf(next24h, (hour) => hour.gustKmh)
  const maxRain24h = maxOf(next24h, (hour) => hour.precipMm)
  const storm = riskLevel(Math.max(maxCode >= 95 ? 92 : 0, maxGust24h * 1.25))
  const frost = riskLevel(minTemp <= 2 ? 92 : minTemp <= 5 ? 58 : 5)
  const fire = riskLevel(minHumidity <= 20 ? 90 : minHumidity <= 30 ? 58 : 8)
  const heavyRain = riskLevel(Math.max(rain24h * 2, maxRain24h * 7, rainChance * 0.72))
  const status = weatherStatus(storm, heavyRain, rainChance)
  const spraying = sprayingRecommendation(rainChance, windSpeed, windGust, humidity, storm)
  const irrigation = irrigationRecommendation(rain24h, rainChance, humidity, climate.weather.et0.valueMm)
  const intensity = rainIntensity(rainNext3h, maxCode)
  const mappedZones = zones.map(mapZone)
  const currentWindDirection = windDirection(first?.windDirectionDeg)

  return {
    farm: {
      id: farm.id,
      name: farm.name,
      latitude: climate.coordinates.latitude,
      longitude: climate.coordinates.longitude,
      city: farm.locality ?? farm.municipality,
      state: farm.state,
    },
    updatedAt: climate.generatedAt,
    current: {
      temperature,
      feelsLike: climate.weather.current.feelsLikeC,
      humidity,
      windSpeed,
      windGust,
      windDirection: currentWindDirection,
      rainChance,
      rainNext3h,
      rainIntensity: intensity,
      condition: conditionFromCode(first?.weatherCode ?? 0, temperature),
      description: climate.weather.current.description,
    },
    status,
    risks: { storm, frost, fire, heavyRain },
    recommendations: { spraying, irrigation },
    alerts: climate.alerts.slice(0, 4).map((alert) => ({
      id: alert.id,
      title: alert.title,
      message: alert.message,
      level: alertRisk(alert),
      timeLabel: alert.timeLabel,
    })),
    interpretation: interpretation(status, rainChance, intensity, currentWindDirection, spraying),
    mapLayers: { rainFrames, rainTileUrl, zones: mappedZones },
    tvMap: {
      icons: mappedZones.map((zone) => ({
        id: `icon:${zone.id}`,
        type: iconFromZone(zone.type),
        region: zone.region,
        label: zone.label,
        detail: `${Math.round(zone.temperatureC)}°C · ${Math.round(zone.rainProbabilityPct)}% chuva`,
      })),
      zones: mappedZones,
      arrows: [
        { id: 'front-south', type: 'front', path: 'M690 860 C760 790 820 715 850 620' },
        { id: 'system-center', type: 'system', path: 'M230 480 C330 425 430 430 520 485' },
        { id: 'wind-coast', type: 'wind', path: 'M780 700 C845 640 870 555 880 470' },
      ],
    },
  }
}
