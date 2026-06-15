import { useMemo } from 'react'
import { useAppData } from './useAppData'

export function useUserSettings() {
  const { settings, updateSettings } = useAppData()

  return useMemo(
    () => ({
      settings,
      updateSettings,
    }),
    [settings, updateSettings],
  )
}
