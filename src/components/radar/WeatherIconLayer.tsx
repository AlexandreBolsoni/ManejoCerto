import { Cloud, CloudLightning, CloudRain, Snowflake, Sun, Wind, type LucideIcon } from 'lucide-react'
import type { RadarWeatherData, WeatherIconType, WeatherRegion } from '../../types/weather'

const positions: Record<WeatherRegion, { left: string; top: string }> = {
  north: { left: '26%', top: '27%' },
  northeast: { left: '76%', top: '33%' },
  centerwest: { left: '42%', top: '47%' },
  southeast: { left: '66%', top: '65%' },
  south: { left: '48%', top: '79%' },
}

const icons: Record<WeatherIconType, LucideIcon> = {
  sun: Sun,
  cloud: Cloud,
  rain: CloudRain,
  storm: CloudLightning,
  frost: Snowflake,
  wind: Wind,
}

export function WeatherIconLayer({ icons: weatherIcons }: { icons: RadarWeatherData['tvMap']['icons'] }) {
  return (
    <div className="radar2-icon-layer" aria-label="Condições meteorológicas por região">
      {weatherIcons.map((item) => {
        const Icon = icons[item.type]
        return (
          <article className={`radar2-map-icon ${item.type}`} key={item.id} style={positions[item.region]}>
            <span>
              <Icon aria-hidden="true" />
            </span>
            <strong>{item.label}</strong>
            <small>{item.detail}</small>
          </article>
        )
      })}
    </div>
  )
}
