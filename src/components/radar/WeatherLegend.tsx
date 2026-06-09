import { ChevronDown, MoveRight, Snowflake, Wind } from 'lucide-react'
import { useState } from 'react'

const legend = [
  { color: '#57b7e8', label: 'Chuva fraca' },
  { color: '#2c78cf', label: 'Chuva moderada' },
  { color: '#2555a8', label: 'Chuva forte' },
  { color: '#9d4edd', label: 'Tempestade severa' },
  { color: '#4eb477', label: 'Tempo estável' },
  { color: '#efb642', label: 'Atenção climática' },
  { color: '#e05a50', label: 'Alerta severo' },
  { color: '#dbe6eb', label: 'Nebulosidade' },
]

export function WeatherLegend() {
  const [open, setOpen] = useState(false)

  return (
    <section className={`radar2-legend ${open ? 'open' : ''}`}>
      <button aria-expanded={open} onClick={() => setOpen((current) => !current)} type="button">
        <span>
          <strong>Legenda do mapa</strong>
          <small>Entenda cores, ícones e deslocamento</small>
        </span>
        <span>
          {open ? 'Ocultar legenda' : 'Ver legenda completa'}
          <ChevronDown size={18} aria-hidden="true" />
        </span>
      </button>
      {open ? (
        <div className="radar2-legend-grid">
          {legend.map((item) => (
            <span key={item.label}>
              <i style={{ background: item.color }} />
              {item.label}
            </span>
          ))}
          <span><Wind size={18} aria-hidden="true" /> Vento</span>
          <span><Snowflake size={18} aria-hidden="true" /> Frente fria / geada</span>
          <span><MoveRight size={18} aria-hidden="true" /> Direção do sistema</span>
        </div>
      ) : null}
    </section>
  )
}
