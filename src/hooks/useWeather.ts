import { useMemo } from 'react'
import { fallbackClimate } from '../services/climateService'
import { useAppData } from './useAppData'

export function useWeather() {
  const { climate, climateLoading, locationError, locationStatus, refreshClimate, requestUserLocation, staleData, userLocation, weatherLocation } =
    useAppData()

  return useMemo(
    () => ({
      climate,
      dashboard: climate ?? fallbackClimate,
      loading: climateLoading,
      locationError,
      locationStatus,
      refreshClimate,
      requestUserLocation,
      staleData,
      userLocation,
      weatherLocation,
    }),
    [climate, climateLoading, locationError, locationStatus, refreshClimate, requestUserLocation, staleData, userLocation, weatherLocation],
  )
}
