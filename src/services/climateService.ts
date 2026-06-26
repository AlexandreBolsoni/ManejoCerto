import { demoAlerts, demoRecommendations, demoWeather } from '../lib/mockData'
import {
  calculateWeatherConfidence,
  weatherGateway,
  type CemadenRainGauge,
  type CptecForecast,
  type OpenMeteoResponse,
  type WeatherConfidence,
} from '../modules/weather'
import { generateRecommendations } from './recommendationEngine'
import type { InmetStationObservation } from './inmetService'
import type { Alert, Coordinates, Farm, Field, ForecastHour, Recommendation, Severity, WeatherSnapshot } from '../types'

export type ClimateDashboard = {
  weather: WeatherSnapshot
  recommendations: Recommendation[]
  alerts: Alert[]
  coordinates: Coordinates
  generatedAt: string
  realTime: boolean
  station: InmetStationObservation | null
  brazilianForecast: CptecForecast | null
  rainGauge: CemadenRainGauge | null
  confidence: WeatherConfidence[]
  sourceStatus: {
    brazilianForecast: string
    rainGauge: string
    forecast: string
    radar: string
    station: string
    feedback: string
  }
}

export const fallbackClimate: ClimateDashboard = {
  weather: demoWeather,
  recommendations: demoRecommendations,
  alerts: demoAlerts,
  coordinates: {
    latitude: -12.5426,
    longitude: -55.7219,
    accuracyM: 2500,
    source: 'manual',
    updatedAt: new Date().toISOString(),
  },
  generatedAt: new Date().toISOString(),
  realTime: false,
  station: null,
  brazilianForecast: null,
  rainGauge: null,
  confidence: [],
  sourceStatus: {
    brazilianForecast: 'CPTEC/BrasilAPI indisponível',
    rainGauge: 'Cemaden aguardando dados',
    forecast: 'Open-Meteo',
    radar: 'RainViewer visual',
    station: 'INMET',
    feedback: 'Feedback local',
  },
}

function weatherDescription(code: number) {
  if ([0].includes(code)) return 'Céu limpo'
  if ([1, 2, 3].includes(code)) return 'Parcialmente nublado'
  if ([45, 48].includes(code)) return 'Neblina'
  if ([51, 53, 55, 56, 57].includes(code)) return 'Garoa'
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Chuva'
  if ([95, 96, 99].includes(code)) return 'Temporal'
  return 'Condição variável'
}

function formatMmRange(value: number) {
  if (value < 0.5) return '0–1 mm'
  const low = Math.max(0, Math.floor(value * 0.75))
  const high = Math.ceil(value * 1.25)
  return `${low}–${high} mm`
}

function formatWindDirection() {
  return 'predominante'
}

function toHour(data: OpenMeteoResponse, index: number): ForecastHour {
  const hourly = data.hourly

  return {
    time: hourly?.time[index] ?? new Date().toISOString(),
    temperatureC: hourly?.temperature_2m[index] ?? 0,
    humidityPct: hourly?.relative_humidity_2m[index] ?? 0,
    precipMm: hourly?.precipitation[index] ?? 0,
    precipProbabilityPct: hourly?.precipitation_probability[index] ?? 0,
    windKmh: hourly?.wind_speed_10m[index] ?? 0,
    gustKmh: hourly?.wind_gusts_10m[index] ?? 0,
    windDirectionDeg: hourly?.wind_direction_10m?.[index],
    et0Mm: hourly?.et0_fao_evapotranspiration[index] ?? 0,
    weatherCode: hourly?.weather_code[index] ?? 0,
  }
}

function getForecastHours(data: OpenMeteoResponse) {
  const times = data.hourly?.time ?? []
  const now = Date.now() - 60 * 60 * 1000
  const firstFuture = Math.max(
    0,
    times.findIndex((time) => new Date(time).getTime() >= now),
  )

  return times.slice(firstFuture, firstFuture + 72).map((_, offset) => toHour(data, firstFuture + offset))
}

function findIrrigationWindow(hours: ForecastHour[]) {
  const best = hours
    .slice(2, 48)
    .find((hour) => hour.precipProbabilityPct < 35 && hour.windKmh < 18 && hour.gustKmh < 28 && hour.humidityPct > 42)

  if (!best) {
    return {
      title: 'Aguardar nova janela',
      description: 'Chuva, vento ou umidade ainda deixam a operação pouco confiável.',
      progressPct: 24,
    }
  }

  const start = new Date(best.time)
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000)
  const format = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const day = start.toLocaleDateString('pt-BR', { weekday: 'short' })

  return {
    title: `${day}, ${format.format(start)}–${format.format(end)}`,
    description: `Vento ${Math.round(best.windKmh)} km/h · ${best.precipProbabilityPct}% de chuva · umidade ${Math.round(best.humidityPct)}%.`,
    progressPct: Math.min(92, Math.max(18, (start.getHours() / 24) * 100)),
  }
}

function getBestCoordinates(farm: Farm, fields: Field[], userLocation?: Coordinates | null, targetField?: Field): Coordinates {
  return targetField?.coordinates ?? farm.coordinates ?? userLocation ?? fields.find((field) => field.coordinates)?.coordinates ?? fallbackClimate.coordinates
}

function getLocationLabel(farm: Farm, coordinates: Coordinates) {
  if (farm.locationLabel) return farm.locationLabel
  return `${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`
}

function applyStationToFirstHour(hours: ForecastHour[], station: InmetStationObservation | null) {
  if (!station?.isFresh || hours.length === 0) return hours

  return hours.map((hour, index) =>
    index === 0
      ? {
          ...hour,
          gustKmh: station.gustKmh ?? hour.gustKmh,
          humidityPct: station.humidityPct ?? hour.humidityPct,
          temperatureC: station.temperatureC ?? hour.temperatureC,
          windKmh: station.windKmh ?? hour.windKmh,
        }
      : hour,
  )
}

function stationSourceDetail(station: InmetStationObservation) {
  const distance = station.station.distanceKm === undefined ? '' : ` · ${station.station.distanceKm.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} km`
  const observedAt = new Date(station.observedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${station.station.name}${distance} · observado ${observedAt}`
}

function buildWeather(
  data: OpenMeteoResponse,
  farm: Farm,
  fields: Field[],
  coordinates: Coordinates,
  station: InmetStationObservation | null,
  brazilianForecast: CptecForecast | null,
  rainGauge: CemadenRainGauge | null,
): WeatherSnapshot {
  const hours = applyStationToFirstHour(getForecastHours(data), station)
  const primaryField = fields[0]
  const current = data.current
  const rain6h = hours.slice(0, 6).reduce((sum, hour) => sum + hour.precipMm, 0)
  const maxProb6h = Math.max(...hours.slice(0, 6).map((hour) => hour.precipProbabilityPct), 0)
  const et0Today = data.daily?.et0_fao_evapotranspiration?.[0] ?? hours.slice(0, 24).reduce((sum, hour) => sum + hour.et0Mm, 0)
  const minToday = data.daily?.temperature_2m_min?.[0] ?? Math.min(...hours.slice(0, 24).map((hour) => hour.temperatureC))
  const maxToday = data.daily?.temperature_2m_max?.[0] ?? Math.max(...hours.slice(0, 24).map((hour) => hour.temperatureC))
  const dailyEt0 = data.daily?.et0_fao_evapotranspiration?.slice(0, 7) ?? []
  const maxEt0 = Math.max(...dailyEt0, et0Today, 1)
  const freshStation = station?.isFresh ? station : null

  return {
    fieldName: primaryField?.name ?? 'Área principal',
    crop: primaryField?.crop ?? farm.productionType,
    stage: primaryField?.stage ?? 'monitoramento',
    location: getLocationLabel(farm, coordinates),
    updatedAtLabel: `atualizado ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
    current: {
      temperatureC: Math.round(freshStation?.temperatureC ?? current?.temperature_2m ?? hours[0]?.temperatureC ?? 0),
      description: weatherDescription(current?.weather_code ?? hours[0]?.weatherCode ?? 0),
      feelsLikeC: Math.round(freshStation?.feelsLikeC ?? (current?.temperature_2m ?? hours[0]?.temperatureC ?? 0) + 1),
      rainNext6h: formatMmRange(rain6h),
      wind: `${Math.round(freshStation?.windKmh ?? current?.wind_speed_10m ?? hours[0]?.windKmh ?? 0)} km/h ${formatWindDirection()}`,
      humidity: `${Math.round(freshStation?.humidityPct ?? current?.relative_humidity_2m ?? hours[0]?.humidityPct ?? 0)}%`,
      minMax: `${Math.round(minToday)}° · ${Math.round(maxToday)}°`,
    },
    et0: {
      valueMm: Number(et0Today.toFixed(1)),
      description:
        rain6h > et0Today
          ? 'Chuva prevista cobre a demanda hídrica estimada para hoje.'
          : 'Demanda hídrica ativa. Verifique janela operacional antes de irrigar.',
      bars: dailyEt0.length > 0 ? dailyEt0.map((value) => Math.max(12, Math.round((value / maxEt0) * 100))) : demoWeather.et0.bars,
    },
    irrigationWindow: findIrrigationWindow(hours),
    sources: [
      { name: 'Open-Meteo', value: `${maxProb6h}%`, detail: 'probabilidade máxima 6h' },
      station
        ? {
            name: 'INMET',
            value: station.temperatureC === undefined ? station.station.code : `${station.temperatureC.toFixed(1)}°C`,
            detail: stationSourceDetail(station),
          }
        : { name: 'INMET', value: 'indisponível', detail: 'sem observação próxima agora' },
      brazilianForecast
        ? {
            name: 'CPTEC/BrasilAPI',
            value: brazilianForecast.days[0]?.conditionDescription ?? 'previsão diária',
            detail: `${brazilianForecast.city}, ${brazilianForecast.state} · fonte complementar`,
          }
        : { name: 'CPTEC/BrasilAPI', value: 'indisponível', detail: 'fonte complementar temporariamente indisponível' },
      rainGauge
        ? {
            name: 'Cemaden',
            value: `${(rainGauge.accumulatedMm.hour1 ?? rainGauge.latestValueMm ?? rainGauge.accumulatedMm.hours24 ?? 0).toFixed(1)} mm`,
            detail: `${rainGauge.stationName} · acumulado em 24h`,
          }
        : { name: 'Cemaden', value: 'indisponível', detail: 'sem pluviômetro próximo ou backend temporariamente indisponível' },
      { name: 'RainViewer', value: 'radar visual', detail: 'camada visual de precipitação; não participa dos cálculos' },
    ],
    forecastHours: hours,
  }
}

function severityFromRisk(value: number): Severity {
  if (value >= 85) return 'critico'
  if (value >= 65) return 'alto'
  if (value >= 38) return 'moderado'
  return 'baixo'
}

function createAlert(id: string, field: Field, type: Alert['type'], title: string, message: string, score: number, timeLabel: string): Alert {
  return {
    id,
    type,
    severity: severityFromRisk(score),
    title,
    message,
    fieldId: field.id,
    fieldName: field.name,
    timeLabel,
  }
}

function generateObservedAlerts(field: Field, station: InmetStationObservation | null) {
  if (!station?.isFresh) return []
  const alerts: Alert[] = []
  const stationLabel = `${station.station.name} (${station.station.code})`

  if ((station.rainMm ?? 0) >= 5) {
    alerts.push(createAlert(`alert-inmet-rain-${field.id}`, field, 'chuva severa', 'Chuva registrada pela estação INMET', `${stationLabel} registrou ${station.rainMm?.toFixed(1)} mm na última observação horária.`, 78, 'agora'))
  }

  if ((station.gustKmh ?? 0) >= 35) {
    alerts.push(createAlert(`alert-inmet-wind-${field.id}`, field, 'vento forte', 'Rajada forte registrada pelo INMET', `${stationLabel} registrou rajada de ${Math.round(station.gustKmh ?? 0)} km/h.`, Math.min(96, (station.gustKmh ?? 0) + 30), 'agora'))
  }

  if ((station.humidityPct ?? 100) <= 30) {
    alerts.push(
      createAlert(
        `alert-inmet-humidity-${field.id}`,
        field,
        (station.humidityPct ?? 100) <= 22 ? 'risco de incendio' : 'baixa umidade',
        'Baixa umidade registrada pelo INMET',
        `${stationLabel} registrou umidade de ${Math.round(station.humidityPct ?? 0)}%.`,
        88 - (station.humidityPct ?? 30),
        'agora',
      ),
    )
  }

  if ((station.temperatureC ?? 99) <= 4) {
    alerts.push(createAlert(`alert-inmet-frost-${field.id}`, field, 'geada', 'Frio crítico registrado pelo INMET', `${stationLabel} registrou ${station.temperatureC?.toFixed(1)}°C.`, 90, 'agora'))
  }

  return alerts
}

function generateForecastAlerts(fields: Field[], weather: WeatherSnapshot, station: InmetStationObservation | null): Alert[] {
  const hours = weather.forecastHours ?? []
  if (fields.length === 0 || hours.length === 0) return []

  const rain24h = hours.slice(0, 24).reduce((sum, hour) => sum + hour.precipMm, 0)
  const maxProb = Math.max(...hours.slice(0, 24).map((hour) => hour.precipProbabilityPct), 0)
  const maxGust = Math.max(...hours.slice(0, 24).map((hour) => hour.gustKmh), 0)
  const minHumidity = Math.min(...hours.slice(0, 24).map((hour) => hour.humidityPct), 100)
  const minTemp72h = Math.min(...hours.slice(0, 72).map((hour) => hour.temperatureC), 99)
  const et0Today = hours.slice(0, 24).reduce((sum, hour) => sum + hour.et0Mm, 0)
  
  const allAlerts: Alert[] = []

  for (const field of fields) {
    const alerts: Alert[] = generateObservedAlerts(field, station)

    if (rain24h >= 18 || maxProb >= 70) {
      alerts.push(
        createAlert(
          `alert-rain-live-${field.id}`,
          field,
          rain24h >= 35 ? 'chuva severa' : 'excesso de chuva',
          rain24h >= 35 ? 'Chuva forte nas próximas 24h' : 'Chuva provável nas próximas horas',
          `${formatMmRange(rain24h)} previstos. Reavalie irrigação e tráfego de máquinas.`,
          Math.max(maxProb, rain24h * 2),
          'próximas 24h',
        ),
      )
    }

    if (maxGust >= 35) {
      alerts.push(
        createAlert(
          `alert-wind-live-${field.id}`,
          field,
          'vento forte',
          'Vento acima do ideal para pulverização',
          `Rajadas de até ${Math.round(maxGust)} km/h. Evite aplicação foliar na janela crítica.`,
          maxGust + 25,
          'hoje',
        ),
      )
    }

    if (minHumidity <= 30) {
      alerts.push(
        createAlert(
          `alert-humidity-live-${field.id}`,
          field,
          minHumidity <= 22 ? 'risco de incendio' : 'baixa umidade',
          minHumidity <= 22 ? 'Risco de incêndio em elevação' : 'Baixa umidade operacional',
          `Umidade pode cair para ${Math.round(minHumidity)}%. Redobre atenção em pulverização e manejo.`,
          85 - minHumidity,
          'tarde',
        ),
      )
    }

    if (minTemp72h <= 4) {
      alerts.push(
        createAlert(
          `alert-frost-live-${field.id}`,
          field,
          'geada',
          'Possibilidade de geada',
          `Temperatura mínima prevista de ${Math.round(minTemp72h)}°C nas próximas 72h.`,
          90 - minTemp72h * 10,
          '72h',
        ),
      )
    }

    if (et0Today >= 4.5 && rain24h < 2) {
      alerts.push(
        createAlert(
          `alert-dry-live-${field.id}`,
          field,
          'estiagem',
          'Demanda hídrica sem chuva suficiente',
          `ET₀ estimada em ${et0Today.toFixed(1)} mm e chuva baixa. Priorize áreas mais sensíveis à seca.`,
          et0Today * 14,
          'hoje',
        ),
      )
    }

    // Filtra duplicatas apenas do próprio talhão e adiciona à lista principal
    const fieldUniqueAlerts = alerts.filter((alert, index, self) => self.findIndex((item) => item.type === alert.type) === index)
    allAlerts.push(...fieldUniqueAlerts)
  }

  return allAlerts
}

export const climateService = {
  async getDashboard(
    fields: Field[],
    farm?: Farm,
    userLocation?: Coordinates | null,
    options: { forceRefresh?: boolean; targetField?: Field; userId?: string } = {},
  ): Promise<ClimateDashboard> {
    const workingFarm = farm ?? {
      id: 'demo-farm',
      name: 'Fazenda Boa Vista',
      municipality: 'Sorriso',
      state: 'MT',
      locationLabel: 'Sorriso, MT',
      productionType: 'Grãos',
      areaHa: 320,
      timezone: 'America/Cuiaba',
      coordinates: fallbackClimate.coordinates,
    }
    const coordinates = getBestCoordinates(workingFarm, fields, userLocation, options.targetField)
    const workingFields = options.targetField
      ? [options.targetField, ...fields.filter((field) => field.id !== options.targetField?.id)]
      : fields
    const cacheOptions = {
      fieldId: options.targetField?.id,
      forceRefresh: options.forceRefresh,
      farmId: workingFarm.id,
      userId: options.userId,
    }

    const stationPromise = weatherGateway.getNearestOfficialObservation(workingFarm, cacheOptions)
    const brazilianForecastPromise = weatherGateway.getBrazilianForecast(workingFarm, cacheOptions)
    const rainGaugePromise = weatherGateway.getNearestRainGauge(workingFarm, cacheOptions)

    try {
      const [data, station, brazilianForecast, rainGauge] = await Promise.all([
        weatherGateway.getForecastByLocation(coordinates, cacheOptions),
        stationPromise,
        brazilianForecastPromise,
        rainGaugePromise,
      ])
      const weather = buildWeather(data, workingFarm, workingFields, coordinates, station, brazilianForecast, rainGauge)
      const alerts = generateForecastAlerts(workingFields, weather, station)
      const confidence = calculateWeatherConfidence({
        cemaden: rainGauge,
        cptec: brazilianForecast,
        forecastHours: weather.forecastHours ?? [],
        station,
      })

      return {
        weather,
        recommendations: generateRecommendations(workingFields, weather),
        alerts,
        coordinates,
        generatedAt: new Date().toISOString(),
        realTime: true,
        station,
        brazilianForecast,
        rainGauge,
        confidence,
        sourceStatus: {
          brazilianForecast: brazilianForecast ? `CPTEC/BrasilAPI · ${brazilianForecast.city}, ${brazilianForecast.state}` : 'CPTEC/BrasilAPI indisponível',
          rainGauge: rainGauge ? `Cemaden ${rainGauge.stationName}` : 'Cemaden sem pluviômetro próximo ou indisponível',
          forecast: 'Open-Meteo em tempo real',
          radar: 'RainViewer visual',
          station: station ? `INMET ${station.station.name} · ${station.station.distanceKm ?? '?'} km` : 'INMET indisponível',
          feedback: 'Feedback local',
        },
      }
    } catch (error) {
      const [station, brazilianForecast, rainGauge] = await Promise.all([
        stationPromise.catch(() => null),
        brazilianForecastPromise.catch(() => null),
        rainGaugePromise.catch(() => null),
      ])
      console.warn('Nao foi possivel buscar previsao em tempo real. Usando fallback local.', error)
      
      const fallbackWeather = {
        ...fallbackClimate.weather,
        fieldName: workingFields[0]?.name ?? 'Área principal',
        crop: workingFields[0]?.crop ?? workingFarm.productionType,
        stage: workingFields[0]?.stage ?? 'cadastro inicial',
        location: workingFarm.locationLabel,
      }

      return {
        ...fallbackClimate,
        weather: fallbackWeather,
        recommendations: generateRecommendations(workingFields, fallbackWeather),
        alerts: workingFields.length > 0 ? generateForecastAlerts(workingFields, fallbackWeather, station) : [],
        coordinates,
        generatedAt: new Date().toISOString(),
        station,
        brazilianForecast,
        rainGauge,
        confidence: calculateWeatherConfidence({
          cemaden: rainGauge,
          cptec: brazilianForecast,
          forecastHours: fallbackClimate.weather.forecastHours ?? [],
          station,
        }),
        sourceStatus: {
          ...fallbackClimate.sourceStatus,
          brazilianForecast: brazilianForecast ? `CPTEC/BrasilAPI · ${brazilianForecast.city}, ${brazilianForecast.state}` : 'CPTEC/BrasilAPI indisponível',
          rainGauge: rainGauge ? `Cemaden ${rainGauge.stationName}` : 'Cemaden sem pluviômetro próximo ou indisponível',
          station: station ? `INMET ${station.station.name} · ${station.station.distanceKm ?? '?'} km` : 'INMET indisponível',
        },
      }
    }
  },
}