import type { CSSProperties } from 'react'
import type { MarketHistoryPoint, MarketPeriod, MarketTrend } from '../types'

export function Sparkline({ trend, values }: { trend: MarketTrend; values: number[] }) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100
      const y = 60 - ((value - min) / Math.max(max - min, 1)) * 46
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg className={`sparkline ${trend}`} role="img" aria-label="histórico curto" viewBox="0 0 100 70">
      <polyline fill="none" points={points} />
    </svg>
  )
}

const marketPeriodLabel: Record<MarketPeriod, string> = {
  annual: 'Anual',
  monthly: 'Mensal',
  weekly: 'Semanal',
}

const minimumCoverageDays: Record<MarketPeriod, number> = {
  annual: 90,
  monthly: 14,
  weekly: 1,
}

function pointsFromValues(values: number[]): MarketHistoryPoint[] {
  return values.map((value, index) => ({
    date: String(index),
    label: String(index + 1),
    value,
  }))
}

function coverageDays(points: MarketHistoryPoint[]) {
  const first = new Date(points[0]?.date ?? '')
  const last = new Date(points[points.length - 1]?.date ?? '')

  if (Number.isNaN(first.getTime()) || Number.isNaN(last.getTime())) {
    return Math.max(points.length - 1, 0)
  }

  return Math.max(0, Math.round((last.getTime() - first.getTime()) / 86400000))
}

function formatCurrencyAxis(value: number) {
  if (Math.abs(value) >= 1000) return `R$ ${(value / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`
  return value.toLocaleString('pt-BR', {
    currency: 'BRL',
    maximumFractionDigits: 0,
    style: 'currency',
  })
}

export function MarketChart({
  period,
  points,
  trend,
  values = [],
}: {
  period: MarketPeriod
  points?: MarketHistoryPoint[]
  trend: MarketTrend
  values?: number[]
}) {
  const chartPoints = points?.length ? points : pointsFromValues(values)
  const daysCovered = coverageDays(chartPoints)
  const minimumDays = minimumCoverageDays[period]

  if (chartPoints.length < 2 || daysCovered < minimumDays) {
    return (
      <div className="market-chart-empty">
        <strong>{marketPeriodLabel[period]}</strong>
        <span>
          {chartPoints.length < 2
            ? 'Cotação atual sem série histórica publicada para este período.'
            : `A fonte trouxe ${daysCovered} dia(s) reais. Para gráfico ${marketPeriodLabel[period].toLowerCase()}, o NimbuES exige pelo menos ${minimumDays} dia(s).`}
        </span>
        {chartPoints.length > 0 ? <em>Último ponto: {chartPoints[chartPoints.length - 1].label}</em> : null}
      </div>
    )
  }

  const min = Math.min(...chartPoints.map((point) => point.value))
  const max = Math.max(...chartPoints.map((point) => point.value))
  const verticalRange = Math.max(max - min, 1)
  const width = 360
  const height = 190
  const padding = { bottom: 34, left: 44, right: 18, top: 18 }
  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom
  const chartPathPoints = chartPoints.map((point, index) => {
    const x = padding.left + (index / Math.max(chartPoints.length - 1, 1)) * plotWidth
    const y = padding.top + plotHeight - ((point.value - min) / verticalRange) * plotHeight
    return { ...point, x, y }
  })
  const linePath = chartPathPoints.map((point) => `${point.x},${point.y}`).join(' ')
  const areaPath = `${padding.left},${height - padding.bottom} ${linePath} ${width - padding.right},${height - padding.bottom}`
  const yLabels = [max, min + verticalRange / 2, min]
  const xLabels = [chartPathPoints[0], chartPathPoints[Math.floor(chartPathPoints.length / 2)], chartPathPoints[chartPathPoints.length - 1]]

  return (
    <svg className={`market-chart ${trend}`} role="img" aria-label={`grafico de mercado ${marketPeriodLabel[period].toLowerCase()}`} viewBox={`0 0 ${width} ${height}`}>
      <rect className="market-chart-bg" height={height - 2} rx="12" width={width - 2} x="1" y="1" />
      {yLabels.map((label, index) => {
        const y = padding.top + (index / 2) * plotHeight
        return (
          <g key={`${label}-${index}`}>
            <line className="market-chart-grid" x1={padding.left} x2={width - padding.right} y1={y} y2={y} />
            <text className="market-chart-y-label" x={padding.left - 8} y={y + 4}>
              {formatCurrencyAxis(label)}
            </text>
          </g>
        )
      })}
      <polygon className="market-chart-area" points={areaPath} />
      <polyline className="market-chart-line" fill="none" points={linePath} />
      {chartPathPoints.map((point, index) => (
        <circle className="market-chart-dot" cx={point.x} cy={point.y} key={`${point.date}-${index}`} r={index === chartPathPoints.length - 1 ? 4.2 : 2.8} />
      ))}
      {xLabels.map((point, index) => (
        <text className="market-chart-x-label" key={`${point.date}-${index}-label`} textAnchor={index === 0 ? 'start' : index === 2 ? 'end' : 'middle'} x={point.x} y={height - 10}>
          {point.label}
        </text>
      ))}
      <text className="market-chart-period" x={width - padding.right} y={padding.top + 2}>
        {marketPeriodLabel[period]}
      </text>
    </svg>
  )
}

export function Et0Bars({ bars }: { bars: number[] }) {
  return (
    <div className="et0-bars" aria-label="histórico ET0">
      {bars.map((bar, index) => (
        <span key={`${bar}-${index}`} style={{ '--bar-height': `${bar}%` } as CSSProperties} />
      ))}
    </div>
  )
}

export function RainTimeline({
  hours,
}: {
  hours: {
    time: string
    precipMm: number
    precipProbabilityPct: number
  }[]
}) {
  const maxRain = Math.max(...hours.map((hour) => hour.precipMm), 1)

  return (
    <div className="rain-timeline" aria-label="chuva hora a hora">
      {hours.map((hour) => {
        const date = new Date(hour.time)
        const height = Math.max(8, Math.round((hour.precipMm / maxRain) * 100))

        return (
          <div key={hour.time}>
            <span style={{ '--rain-height': `${height}%` } as CSSProperties} />
            <strong>{date.toLocaleTimeString('pt-BR', { hour: '2-digit' })}</strong>
            <small>{Math.round(hour.precipProbabilityPct)}%</small>
          </div>
        )
      })}
    </div>
  )
}
