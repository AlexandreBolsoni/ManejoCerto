import type { Coordinates, Farm, Field } from '../../../types'

export type WeatherLocationTarget = {
  coordinates: Coordinates
  source: 'field' | 'farm' | 'user'
  label: string
  farmId?: string
  fieldId?: string
  inheritedFromFarm?: boolean
}

export function resolveWeatherLocation({
  activeFieldId,
  farm,
  fields,
  userLocation,
}: {
  activeFieldId?: string | null
  farm: Farm | null
  fields: Field[]
  userLocation?: Coordinates | null
}): WeatherLocationTarget | null {
  const activeField = activeFieldId ? fields.find((field) => field.id === activeFieldId) : null

  if (activeField?.coordinates) {
    return {
      coordinates: activeField.coordinates,
      source: 'field',
      label: activeField.name,
      farmId: farm?.id,
      fieldId: activeField.id,
    }
  }

  if (activeField && farm?.coordinates) {
    return {
      coordinates: farm.coordinates,
      source: 'field',
      label: `${activeField.name} · centro da fazenda`,
      farmId: farm.id,
      fieldId: activeField.id,
      inheritedFromFarm: true,
    }
  }

  if (farm?.coordinates) {
    return {
      coordinates: farm.coordinates,
      source: 'farm',
      label: farm.name,
      farmId: farm.id,
    }
  }

  if (!farm && userLocation) {
    return {
      coordinates: userLocation,
      source: 'user',
      label: 'Localização aproximada',
    }
  }

  return null
}
