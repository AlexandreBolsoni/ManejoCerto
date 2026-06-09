import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAppData } from './useAppData'
import { useAuth } from './useAuth'
import { weatherGateway } from '../modules/weather'
import { radarService, type RadarFrame } from '../services/radarService'
import { weatherZoneService, type WeatherZone } from '../services/weatherZoneService'
import { radarWeatherCache } from '../services/weather/weatherCache'
import { mapClimateToRadarWeather } from '../services/weather/weatherMapper'
import type { RadarWeatherData } from '../types/weather'

export function useRadarWeather() {
  const { user } = useAuth()
  const {
    activeFieldId,
    climate,
    climateLoading,
    farm,
    isOnline,
    refreshClimate,
    staleData,
    weatherLocation,
  } = useAppData()
  const [zones, setZones] = useState<WeatherZone[]>([])
  const [rainFrames, setRainFrames] = useState<RadarFrame[]>([])
  const [rainTileUrl, setRainTileUrl] = useState<string>()
  const [visualLoading, setVisualLoading] = useState(true)
  const [visualError, setVisualError] = useState('')
  const wasOnline = useRef(isOnline)
  const userId = user?.id ?? 'demo-user'
  const cachedData = useMemo<RadarWeatherData | null>(() => (farm ? radarWeatherCache.load(farm.id)?.data ?? null : null), [farm])

  const loadVisualData = useCallback(
    async (forceRefresh = false) => {
      if (!farm || !weatherLocation) return
      setVisualLoading(true)
      setVisualError('')

      const options = {
        farmId: farm.id,
        fieldId: activeFieldId ?? undefined,
        forceRefresh,
        userId,
      }
      const [localZoneResult, nationalZoneResult, radarResult] = await Promise.allSettled([
        weatherZoneService.getZones(weatherLocation.coordinates, 'today', options),
        weatherZoneService.getNationalZones('today', options),
        weatherGateway.getVisualRadarMetadata(options),
      ])

      const nextZones = [
        ...(localZoneResult.status === 'fulfilled' ? localZoneResult.value : []),
        ...(nationalZoneResult.status === 'fulfilled' ? nationalZoneResult.value : []),
      ]
      if (nextZones.length > 0) setZones(nextZones)
      if (radarResult.status === 'fulfilled') {
        const frames = radarResult.value.frames
        const frame = [...frames].reverse().find((item) => item.type === 'past') ?? frames.at(-1)
        setRainFrames(frames)
        setRainTileUrl(radarService.tileUrl(radarResult.value, frame) || undefined)
      }
      if (localZoneResult.status === 'rejected' && nationalZoneResult.status === 'rejected' && radarResult.status === 'rejected') {
        setVisualError('Não conseguimos atualizar as camadas do mapa agora.')
      }
      setVisualLoading(false)
    },
    [activeFieldId, farm, userId, weatherLocation],
  )

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadVisualData(), 0)
    return () => window.clearTimeout(timeout)
  }, [loadVisualData])

  useEffect(() => {
    if (!wasOnline.current && isOnline) {
      void Promise.all([refreshClimate(), loadVisualData(true)])
    }
    wasOnline.current = isOnline
  }, [isOnline, loadVisualData, refreshClimate])

  const liveData = useMemo(() => {
    if (!climate || !farm) return null
    return mapClimateToRadarWeather({ climate, farm, rainFrames, rainTileUrl, zones })
  }, [climate, farm, rainFrames, rainTileUrl, zones])

  useEffect(() => {
    if (!liveData) return
    radarWeatherCache.save(liveData)
  }, [liveData])

  const refresh = useCallback(async () => {
    await Promise.all([refreshClimate(), loadVisualData(true)])
  }, [loadVisualData, refreshClimate])

  return {
    data: liveData ?? cachedData,
    error: visualError,
    isCached: Boolean(cachedData && (!liveData || staleData || !isOnline)),
    isOnline,
    loading: climateLoading && !liveData && !cachedData,
    refresh,
    staleData,
    visualLoading,
  }
}
