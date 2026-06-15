import { useMemo } from 'react'
import { useAppData } from './useAppData'

export function useCurrentFarm() {
  const { deleteFarm, farm, requestUserLocation, saveFarm, userLocation } = useAppData()

  return useMemo(
    () => ({
      deleteFarm,
      farm,
      hasFarm: Boolean(farm),
      requestUserLocation,
      saveFarm,
      userLocation,
    }),
    [deleteFarm, farm, requestUserLocation, saveFarm, userLocation],
  )
}
