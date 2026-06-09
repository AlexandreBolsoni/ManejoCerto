import type { CSSProperties } from 'react'
import type { RadarWeatherData, WeatherRegion } from '../../types/weather'

const regionShapes: Record<WeatherRegion, { accent: string; shape: string }> = {
  north: {
    shape: 'M70 225 C120 100 320 75 430 165 C500 235 455 345 350 370 C210 400 75 335 70 225 Z',
    accent: 'M70 260 C130 190 245 190 300 250 C290 330 160 360 70 300 Z',
  },
  northeast: {
    shape: 'M570 165 C700 120 890 205 915 330 C920 425 810 475 680 430 C575 395 520 265 570 165 Z',
    accent: 'M735 225 C855 215 920 285 895 365 C830 405 750 365 735 225 Z',
  },
  centerwest: {
    shape: 'M245 350 C350 280 560 315 625 445 C650 555 545 640 395 620 C270 610 195 475 245 350 Z',
    accent: 'M230 445 C310 380 430 405 465 485 C430 570 295 575 230 500 Z',
  },
  southeast: {
    shape: 'M500 520 C620 475 780 550 780 670 C740 765 590 790 490 710 C430 645 445 565 500 520 Z',
    accent: 'M635 565 C745 560 790 630 750 705 C660 735 610 670 635 565 Z',
  },
  south: {
    shape: 'M375 690 C475 630 650 700 660 815 C620 925 455 930 375 835 C330 785 335 730 375 690 Z',
    accent: 'M365 750 C435 700 535 750 545 825 C490 885 390 850 365 750 Z',
  },
}

export function WeatherMapLayer({
  arrows,
  zones,
}: {
  arrows: RadarWeatherData['tvMap']['arrows']
  zones: RadarWeatherData['tvMap']['zones']
}) {
  return (
    <div className="radar2-weather-layer" aria-hidden="true">
      <svg preserveAspectRatio="none" viewBox="0 0 1000 1000">
        <defs>
          <filter id="radar2-soft-zone">
            <feGaussianBlur stdDeviation="20" />
          </filter>
          <marker id="radar2-arrow-head" markerHeight="8" markerWidth="8" orient="auto" refX="6" refY="3">
            <path d="M0,0 L0,6 L7,3 z" fill="rgba(183, 239, 255, .9)" />
          </marker>
        </defs>
        {zones.map((zone) => {
          const paths = regionShapes[zone.region]
          const style = { '--radar-zone': zone.color } as CSSProperties
          return (
            <g className={`radar2-zone ${zone.type} ${zone.intensity}`} key={zone.id} style={style}>
              <path className="radar2-zone-halo" d={paths.shape} />
              <path className="radar2-zone-body" d={paths.shape} />
              <path className="radar2-zone-accent" d={paths.accent} />
            </g>
          )
        })}
        <g className="radar2-system-arrows">
          {arrows.map((arrow) => (
            <path className={arrow.type} d={arrow.path} key={arrow.id} />
          ))}
        </g>
      </svg>
    </div>
  )
}
