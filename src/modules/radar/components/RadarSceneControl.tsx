import type { RadarSceneMode } from '../types/radar.types'
import { sceneModes } from '../utils/radarOptions'

export function RadarSceneControl({
  activeMode,
  onChange,
}: {
  activeMode: RadarSceneMode
  onChange: (mode: RadarSceneMode) => void
}) {
  return (
    <div className="radar-climate-scene-control" aria-label="Modo do radar">
      {sceneModes.map(({ Icon, id, label }) => (
        <button className={activeMode === id ? 'active' : ''} key={id} onClick={() => onChange(id)} type="button">
          <Icon size={18} aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  )
}
