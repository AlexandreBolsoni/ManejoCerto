import { useMemo } from 'react'
import { useAppData } from './useAppData'

export function useAlerts() {
  const { alerts, archiveAlert, muteAlert } = useAppData()

  return useMemo(
    () => ({
      activeAlerts: alerts,
      archiveAlert,
      hasAlerts: alerts.length > 0,
      muteAlert,
    }),
    [alerts, archiveAlert, muteAlert],
  )
}
