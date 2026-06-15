import { LocateFixed, RefreshCw } from 'lucide-react'
import type { Coordinates } from '../../../types'
import { Button } from '../../../components/ui'
import { locationButtonLabel } from '../../../utils/locationText'

export type DashboardHeaderProps = {
  fieldName: string
  crop: string
  firstName: string
  headerLocation: string
  locationStatus: string
  onRefresh: () => void
  onRequestLocation: () => void
  userLocation: Coordinates | null
}

export function DashboardHeader({
  crop,
  fieldName,
  firstName,
  headerLocation,
  locationStatus,
  onRefresh,
  onRequestLocation,
  userLocation,
}: DashboardHeaderProps) {
  return (
    <header className="dashboard-header dashboard-today-header">
      <div>
        <h1>Bom dia, {firstName}</h1>
        <p>
          {fieldName} · {crop} · {headerLocation}
        </p>
      </div>
      <div className="dashboard-actions">
        <Button onClick={onRequestLocation} type="button" variant="secondary">
          <LocateFixed size={17} aria-hidden="true" />
          {locationStatus === 'requesting' ? 'Buscando...' : locationButtonLabel(userLocation)}
        </Button>
        <Button onClick={onRefresh} variant="secondary">
          <RefreshCw size={17} aria-hidden="true" />
          Atualizar
        </Button>
      </div>
    </header>
  )
}
