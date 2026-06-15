import { Radar, RefreshCw } from 'lucide-react'
import { Button } from '../ui'
import { APP_STATE } from '../../config/brand'
import type { Field } from '../../types'
import type { RadarWeatherData } from '../../types/weather'

function updatedLabel(updatedAt?: string) {
  if (!updatedAt) return 'Aguardando primeira leitura'
  return `Atualizado às ${new Date(updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

export function RadarHeader({
  activeFieldId,
  data,
  fields,
  loading,
  onFieldChange,
  onRefresh,
}: {
  activeFieldId: string | null
  data: RadarWeatherData | null
  fields: Field[]
  loading: boolean
  onFieldChange: (fieldId: string | null) => void
  onRefresh: () => void
}) {
  const stateLabel = data?.farm.state || APP_STATE
  const locationLabel = [data?.farm.city, stateLabel].filter(Boolean).join(', ')

  return (
    <header className="radar2-header">
      <div className="radar2-heading">
        <span className="radar2-heading-icon">
          <Radar size={22} aria-hidden="true" />
        </span>
        <div>
          <span>Inteligência climática</span>
          <h1>Radar Climático</h1>
          <p>
            {data?.farm.name ?? 'Sua fazenda'}
            {locationLabel ? ` · ${locationLabel}` : ''}
            <small>Hoje · {updatedLabel(data?.updatedAt)}</small>
          </p>
        </div>
      </div>
      <div className="radar2-header-actions">
        {data ? (
          <label className="radar2-target-select">
            <span>Leitura para</span>
            <select onChange={(event) => onFieldChange(event.target.value || null)} value={activeFieldId ?? ''}>
              <option value="">Fazenda · {data.farm.name}</option>
              {fields.map((field) => (
                <option key={field.id} value={field.id}>
                  Área · {field.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <Button className="radar2-refresh" disabled={loading} onClick={onRefresh} type="button" variant="secondary">
          <RefreshCw className={loading ? 'spin' : ''} size={17} aria-hidden="true" />
          <span>Atualizar</span>
        </Button>
      </div>
    </header>
  )
}
