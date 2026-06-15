import { LocateFixed } from 'lucide-react'
import type { Coordinates } from '../../../types'
import { Button, EmptyState, LinkButton } from '../../../components/ui'
import { locationButtonLabel } from '../../../utils/locationText'

export type DashboardOnboardingStateProps = {
  locationError: string
  locationStatus: string
  onRequestLocation: () => void
  userLocation: Coordinates | null
}

export function DashboardOnboardingState({ locationError, locationStatus, onRequestLocation, userLocation }: DashboardOnboardingStateProps) {
  return (
    <>
      <header className="dashboard-header">
        <div>
          <span className="eyebrow">PRIMEIRO ACESSO</span>
          <h1>Cadastre sua fazenda</h1>
          <p>O NimbuES só calcula clima, radar e recomendações depois que você define a localização operacional.</p>
        </div>
        <div className="dashboard-actions">
          <Button onClick={onRequestLocation} type="button" variant="secondary">
            <LocateFixed size={17} aria-hidden="true" />
            {locationStatus === 'requesting' ? 'Buscando...' : locationButtonLabel(userLocation)}
          </Button>
          <LinkButton to="/fazenda/nova">Cadastrar fazenda</LinkButton>
        </div>
      </header>
      {locationError ? <p className="inline-warning">{locationError}</p> : null}
      <EmptyState
        action={<LinkButton to="/fazenda/nova">Começar cadastro</LinkButton>}
        body="A localização pode ser aproximada no início. Depois você ajusta o pino da fazenda e de cada área de cultivo para melhorar meteorologia, radar e alertas."
        title="Nenhuma fazenda cadastrada"
      />
    </>
  )
}
