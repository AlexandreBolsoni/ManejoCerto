import { BarChart3, Map } from 'lucide-react'

export type RadarPrimaryView = 'map' | 'quick'

export function RadarViewSwitcher({
  activeView,
  onChange,
}: {
  activeView: RadarPrimaryView
  onChange: (view: RadarPrimaryView) => void
}) {
  return (
    <div className="radar2-view-switcher" aria-label="Visualização do radar" role="tablist">
      <button
        aria-selected={activeView === 'map'}
        className={activeView === 'map' ? 'active' : ''}
        onClick={() => onChange('map')}
        role="tab"
        type="button"
      >
        <Map size={18} aria-hidden="true" />
        <span>
          <strong>Tempo Hoje</strong>
          Mapa ilustrado
        </span>
      </button>
      <button
        aria-selected={activeView === 'quick'}
        className={activeView === 'quick' ? 'active' : ''}
        onClick={() => onChange('quick')}
        role="tab"
        type="button"
      >
        <BarChart3 size={18} aria-hidden="true" />
        <span>
          <strong>Dados Rápidos</strong>
          Decisão no campo
        </span>
      </button>
    </div>
  )
}
