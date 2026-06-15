import type { RadarWeatherData } from '../../types/weather'
import { localStorageAdapter } from '../storage'

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
    return localStorageAdapter.getJson<CachedRadarWeather>(key(farmId))
  },

  save(data: RadarWeatherData) {
    localStorageAdapter.setJson(key(data.farm.id), { data, savedAt: new Date().toISOString() })
  },
}
