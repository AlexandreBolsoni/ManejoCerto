import { useMemo } from 'react'
import { useAppData } from './useAppData'

export function useNetworkStatus() {
  const { isOnline, staleData } = useAppData()

  return useMemo(
    () => ({
      isOnline,
      staleData,
    }),
    [isOnline, staleData],
  )
}
