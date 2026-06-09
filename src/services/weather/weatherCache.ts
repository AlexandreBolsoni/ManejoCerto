import type { RadarWeatherData } from '../../types/weather'

const CACHE_PREFIX = 'nimbo:radar-weather:v1'

type CachedRadarWeather = {
  savedAt: string
  data: RadarWeatherData
}

function key(farmId: string) {
  return `${CACHE_PREFIX}:${farmId}`
}

export const radarWeatherCache = {
  load(farmId: string): CachedRadarWeather | null {
    if (typeof window === 'undefined') return null

    try {
      const stored = window.localStorage.getItem(key(farmId))
      return stored ? (JSON.parse(stored) as CachedRadarWeather) : null
    } catch {
      return null
    }
  },

  save(data: RadarWeatherData) {
    if (typeof window === 'undefined') return

    try {
      window.localStorage.setItem(key(data.farm.id), JSON.stringify({ data, savedAt: new Date().toISOString() }))
    } catch {
      // Offline cache is best-effort.
    }
  },
}
