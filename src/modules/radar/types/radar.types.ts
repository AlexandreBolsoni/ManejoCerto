import type { LucideIcon } from 'lucide-react'
import type { ForecastHour } from '../../../types'

export type RadarSceneMode = 'local' | 'satellite' | 'summary'

export type RadarMapLayer = 'rain' | 'clouds' | 'temperature' | 'wind'

export type TimelineItem = {
  detail: string
  hour?: ForecastHour
  id: string
  label: string
  tileUrl?: string
}

export type RadarSceneOption = {
  Icon: LucideIcon
  id: RadarSceneMode
  label: string
}

export type RadarMapLayerOption = {
  Icon: LucideIcon
  id: RadarMapLayer
  label: string
}
