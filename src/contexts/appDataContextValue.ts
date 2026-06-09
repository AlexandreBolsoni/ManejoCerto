import { createContext } from 'react'
import type { Alert, Coordinates, Farm, Feedback, Field, UserSettings } from '../types'
import type { ClimateDashboard } from '../services/climateService'
import type { LocationStatus } from '../services/locationService'
import type { WeatherLocationTarget } from '../modules/weather'

export type AppDataContextValue = {
  farm: Farm | null
  fields: Field[]
  alerts: Alert[]
  climate: ClimateDashboard | null
  settings: UserSettings
  feedbackQueue: Feedback[]
  climateLoading: boolean
  isOnline: boolean
  staleData: boolean
  userLocation: Coordinates | null
  locationStatus: LocationStatus
  locationError: string
  activeFieldId: string | null
  weatherLocation: WeatherLocationTarget | null
  setActiveFieldId: (fieldId: string | null) => void
  saveFarm: (farm: Farm) => Promise<void>
  addField: (field: Field) => Promise<void>
  deleteFarm: (farmId: string) => Promise<void>
  deleteField: (fieldId: string) => Promise<void>
  requestUserLocation: () => Promise<Coordinates | null>
  muteAlert: (alertId: string) => void
  archiveAlert: (alertId: string) => void
  saveFeedback: (feedback: Omit<Feedback, 'id' | 'createdAt' | 'status'>) => Promise<void>
  refreshClimate: () => Promise<void>
  updateSettings: (settings: UserSettings) => void
}

export const AppDataContext = createContext<AppDataContextValue | null>(null)
