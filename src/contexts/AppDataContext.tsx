import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { demoSettings } from '../lib/mockData'
import { createAppError } from '../lib/errors'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { usePersistentState } from '../hooks/usePersistentState'
import { climateService, type ClimateDashboard } from '../services/climateService'
import { farmService } from '../services/farmService'
import { feedbackService } from '../services/feedbackService'
import { fieldService } from '../services/fieldService'
import { locationService, type LocationStatus } from '../services/locationService'
import type { Alert, Coordinates, Farm, Feedback, Field, UserSettings } from '../types'
import { useAuth } from '../hooks/useAuth'
import { resolveWeatherLocation } from '../modules/weather'
import { AppDataContext, type AppDataContextValue } from './appDataContextValue'

function locationErrorMessage(status: LocationStatus, error?: unknown) {
  const details = error instanceof Error && error.message ? ` (${error.message})` : ''

  if (status === 'denied') {
    return 'Permissao de localizacao negada. Libere a permissao do navegador para usar radar preciso.'
  }

  if (status === 'unavailable') {
    return `Geolocalizacao indisponivel neste ambiente. Ative o servico de localizacao do Windows/navegador ou use a localizacao cadastrada da fazenda.${details}`
  }

  if (status === 'timeout') {
    return 'Tempo esgotado ao buscar GPS. Use a localizacao por rede, informe a localidade capixaba ou ajuste o pino da fazenda no mapa.'
  }

  return `Nao foi possivel obter localizacao agora. O Manejo Certo continuara usando a localizacao cadastrada da fazenda quando ela existir.${details}`
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id ?? 'demo-user'
  const isOnline = useOnlineStatus()
  const [farm, setFarm] = useState<Farm | null>(null)
  const [fields, setFields] = useState<Field[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [settings, setSettings] = usePersistentState<UserSettings>('nimbo:settings', demoSettings)
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null)
  const [feedbackQueue, setFeedbackQueue] = useState<Feedback[]>([])
  const [climate, setClimate] = useState<ClimateDashboard | null>(null)
  const [climateLoading, setClimateLoading] = useState(true)
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle')
  const [locationError, setLocationError] = useState('')
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null)
  const [trackingLocation, setTrackingLocation] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(() => Date.now())
  const [clock, setClock] = useState(() => Date.now())

  useEffect(() => {
    const interval = window.setInterval(() => setClock(Date.now()), 60_000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    let cancelled = false

    farmService
      .listFarms(userId)
      .then(async (farms) => {
        if (cancelled) return
        const selectedFarm = farms[0] ?? null
        setFarm(selectedFarm)
        setActiveFieldId(null)
        if (!selectedFarm) {
          setFields([])
          setClimate(null)
          setAlerts([])
          setClimateLoading(false)
          return
        }
        setClimateLoading(true)
        const loadedFields = await fieldService.listFields(userId, selectedFarm.id)
        if (!cancelled) setFields(loadedFields)
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [setFarm, setFields, userId])

  useEffect(() => {
    if (!trackingLocation) return undefined

    const watchId = locationService.watchPosition(
      (coordinates) => {
        setUserLocation(coordinates)
        setLocationStatus('tracking')
        setLocationError('')
      },
      (status) => {
        setLocationStatus(status)
        setLocationError(locationErrorMessage(status))
      },
    )

    return () => {
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId)
    }
  }, [setUserLocation, trackingLocation])

  useEffect(() => {
    let cancelled = false

    if (!farm) {
      return () => {
        cancelled = true
      }
    }

    const activeField = activeFieldId ? fields.find((field) => field.id === activeFieldId) : undefined

    climateService
      .getDashboard(fields, farm, userLocation, { targetField: activeField, userId })
      .then((dashboard) => {
        if (cancelled) return
        setClimate(dashboard)
        setAlerts(dashboard.alerts)
        setClimateLoading(false)
        setLastRefresh(Date.now())
      })
      .catch(() => {
        if (!cancelled) setClimateLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [activeFieldId, farm, fields, setAlerts, userId, userLocation])

  useEffect(() => {
    feedbackService
      .listQueue()
      .then(setFeedbackQueue)
      .catch(() => setFeedbackQueue([]))
  }, [])

  useEffect(() => {
    if (!isOnline) return

    feedbackService
      .markQueuedAsSynced()
      .then(() => feedbackService.listQueue())
      .then(setFeedbackQueue)
      .catch(() => undefined)
  }, [isOnline])

  const effectiveSettings = useMemo<UserSettings>(() => ({ ...demoSettings, ...settings }), [settings])
  const weatherLocation = useMemo(
    () => resolveWeatherLocation({ activeFieldId, farm, fields, userLocation }),
    [activeFieldId, farm, fields, userLocation],
  )

  const value = useMemo<AppDataContextValue>(
    () => ({
      farm,
      fields,
      alerts: alerts.filter((alert) => !alert.archived),
      climate,
      settings: effectiveSettings,
      feedbackQueue,
      climateLoading,
      isOnline,
      staleData: !isOnline || clock - lastRefresh > 15 * 60 * 1000,
      userLocation,
      locationStatus,
      locationError,
      activeFieldId,
      weatherLocation,
      setActiveFieldId,
      async saveFarm(nextFarm) {
        const saved = await farmService.saveFarm(userId, nextFarm)
        setFarm(saved)
      },
      async addField(field) {
        if (!farm) {
          throw createAppError('VALIDATION_ERROR', 'Cadastre uma fazenda antes de criar uma area de cultivo.')
        }

        const saved = await fieldService.saveField(userId, farm.id, field)
        setFields((current) => [...current.filter((item) => item.id !== saved.id), saved])
      },
      async deleteFarm(farmId) {
        await farmService.deleteFarm(userId, farmId)
        fieldService.clearFarmFields(userId, farmId)
        setFarm((current) => (current?.id === farmId ? null : current))
        setActiveFieldId(null)
        setFields([])
        setClimate(null)
        setAlerts([])
      },
      async deleteField(fieldId) {
        if (!farm) return
        await fieldService.deleteField(userId, farm.id, fieldId)
        setFields((current) => current.filter((field) => field.id !== fieldId))
        setActiveFieldId((current) => (current === fieldId ? null : current))
      },
      async requestUserLocation() {
        setLocationStatus('requesting')
        setLocationError('')

        try {
          const coordinates = await locationService.getCurrentPosition()
          setUserLocation(coordinates)
          setTrackingLocation(coordinates.source === 'usuario')
          setLocationStatus(coordinates.source === 'usuario' ? 'tracking' : 'idle')
          if (farm) {
            const nextFarm = {
              ...farm,
              coordinates,
              locationLabel: `${coordinates.latitude.toFixed(5)}, ${coordinates.longitude.toFixed(5)}`,
            }
            setFarm(nextFarm)
            void farmService.saveFarm(userId, nextFarm)
          }
          return coordinates
        } catch (error) {
          const status = (error as { status?: LocationStatus }).status ?? 'error'
          setTrackingLocation(false)
          if (farm?.coordinates) {
            const farmCoordinates = {
              ...farm.coordinates,
              source: 'fazenda' as const,
              updatedAt: new Date().toISOString(),
            }
            setUserLocation(farmCoordinates)
            setLocationStatus('idle')
            setLocationError('GPS e localizacao por rede indisponiveis agora. Usando o pino cadastrado da fazenda.')
            return farmCoordinates
          }
          setLocationStatus(status)
          setLocationError(locationErrorMessage(status, error))
          return null
        }
      },
      muteAlert(alertId) {
        setAlerts((current) => current.map((alert) => (alert.id === alertId ? { ...alert, muted: true } : alert)))
      },
      archiveAlert(alertId) {
        setAlerts((current) => current.map((alert) => (alert.id === alertId ? { ...alert, archived: true } : alert)))
      },
      async saveFeedback(feedback) {
        const saved = await feedbackService.saveFeedback(userId, feedback)
        setFeedbackQueue((current) => [...current, saved])
      },
      async refreshClimate() {
        setClimateLoading(true)
        if (!farm) {
          setClimate(null)
          setAlerts([])
          setClimateLoading(false)
          setClock(Date.now())
          return
        }

        const activeField = activeFieldId ? fields.find((field) => field.id === activeFieldId) : undefined
        const dashboard = await climateService.getDashboard(fields, farm, userLocation, {
          forceRefresh: true,
          targetField: activeField,
          userId,
        })
        setClimate(dashboard)
        setAlerts(dashboard.alerts)
        setClimateLoading(false)
        setLastRefresh(Date.now())
        setClock(Date.now())
      },
      updateSettings(nextSettings) {
        setSettings(nextSettings)
      },
    }),
    [
      alerts,
      activeFieldId,
      clock,
      climate,
      climateLoading,
      effectiveSettings,
      farm,
      feedbackQueue,
      fields,
      isOnline,
      lastRefresh,
      locationError,
      locationStatus,
      weatherLocation,
      setAlerts,
      setFarm,
      setFields,
      setSettings,
      setUserLocation,
      userLocation,
      userId,
    ],
  )

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}
