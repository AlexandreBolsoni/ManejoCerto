import type { Field, Recommendation, Severity, WeatherSnapshot } from '../types'

function classifySeverity(confidence: number): Severity {
  if (confidence >= 90) return 'alto'
  if (confidence >= 75) return 'moderado'
  return 'baixo'
}

function sumRain(weather: WeatherSnapshot, hours: number) {
  const forecastSum = weather.forecastHours?.slice(0, hours).reduce((sum, hour) => sum + hour.precipMm, 0)
  if (forecastSum !== undefined) return forecastSum

  const values = weather.current.rainNext6h.match(/\d+(?:[,.]\d+)?/g)?.map((value) => Number(value.replace(',', '.'))) ?? []
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function maxWind(weather: WeatherSnapshot, hours: number) {
  return Math.max(...(weather.forecastHours?.slice(0, hours).map((hour) => hour.gustKmh) ?? [0]))
}

function minHumidity(weather: WeatherSnapshot, hours: number) {
  return Math.min(...(weather.forecastHours?.slice(0, hours).map((hour) => hour.humidityPct) ?? [70]))
}

function bestSprayWindow(weather: WeatherSnapshot) {
  const window = weather.forecastHours
    ?.slice(1, 36)
    .find((hour) => hour.gustKmh < 24 && hour.windKmh < 16 && hour.humidityPct >= 50 && hour.precipProbabilityPct < 35)

  if (!window) return 'quando vento e umidade voltarem à faixa operacional'

  return new Date(window.time).toLocaleString('pt-BR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function generateRecommendations(fields: Field[], weather: WeatherSnapshot): Recommendation[] {
  const primaryField = fields[0]
  const hasInmet = weather.sources.some((source) => source.name === 'INMET' && source.value !== 'indisponível')
  const observationSources = hasInmet ? ['Previsão', 'INMET', 'Feedback local'] : ['Previsão', 'Feedback local']
  const rain6h = sumRain(weather, 6)
  const rain24h = sumRain(weather, 24)
  const gust24h = maxWind(weather, 24)
  const humidity24h = minHumidity(weather, 24)
  const irrigationConfidence = Math.min(96, Math.max(68, Math.round(72 + rain6h * 2 + (weather.et0.valueMm > 4 ? 8 : 0))))
  const shouldDelayIrrigation = rain6h >= 4 || rain24h >= weather.et0.valueMm

  return [
    {
      id: 'rec-irrigacao-gerada',
      kind: 'irrigacao',
      title: shouldDelayIrrigation ? 'Adiar irrigação e reavaliar após a chuva' : 'Irrigar na melhor janela disponível',
      description: shouldDelayIrrigation
        ? `${weather.current.rainNext6h} de chuva nas próximas 6h e ET₀ de ${weather.et0.valueMm.toFixed(1)} mm. Evite lâmina desnecessária.`
        : `Chuva baixa nas próximas 24h e ET₀ de ${weather.et0.valueMm.toFixed(1)} mm. Use a janela indicada pelo NibusES.`,
      action: shouldDelayIrrigation ? 'Adiar irrigação' : 'Programar irrigação',
      justification: `Chuva 6h: ${weather.current.rainNext6h}. Chuva 24h estimada: ${rain24h.toFixed(1)} mm. ET₀: ${weather.et0.valueMm.toFixed(1)} mm.`,
      confidence: irrigationConfidence,
      sources: observationSources,
      severity: classifySeverity(irrigationConfidence),
      fieldId: primaryField?.id ?? 'norte',
      fieldName: primaryField?.name ?? weather.fieldName,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'rec-pulverizacao-gerada',
      kind: 'pulverizacao',
      title: gust24h >= 28 || humidity24h < 45 ? 'Reprogramar pulverização' : 'Pulverização possível com janela curta',
      description:
        gust24h >= 28 || humidity24h < 45
          ? `Rajadas até ${Math.round(gust24h)} km/h ou umidade mínima de ${Math.round(humidity24h)}%. Melhor janela: ${bestSprayWindow(weather)}.`
          : `Vento e umidade ficam dentro da faixa operacional. Melhor janela: ${bestSprayWindow(weather)}.`,
      action: gust24h >= 28 || humidity24h < 45 ? 'Reprogramar aplicação' : 'Reservar janela',
      justification: `Rajada máxima 24h: ${Math.round(gust24h)} km/h. Umidade mínima: ${Math.round(humidity24h)}%.`,
      confidence: gust24h >= 28 ? 88 : 82,
      sources: hasInmet ? ['Previsão', 'INMET'] : ['Previsão'],
      severity: 'moderado',
      fieldId: primaryField?.id ?? 'norte',
      fieldName: primaryField?.name ?? weather.fieldName,
      updatedAt: new Date().toISOString(),
    },
  ]
}
