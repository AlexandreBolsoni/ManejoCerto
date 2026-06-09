import { MapPin } from 'lucide-react'
import { CircleMarker, Popup, Tooltip } from 'react-leaflet'
import type { RadarWeatherData } from '../../types/weather'

export function FarmLocationMarker({ farm }: { farm: RadarWeatherData['farm'] }) {
  const locationLabel = farm.city || farm.name

  return (
    <CircleMarker
      center={[farm.latitude, farm.longitude]}
      color="#ffffff"
      fillColor="#7cb55c"
      fillOpacity={1}
      pathOptions={{ className: 'radar2-farm-pulse' }}
      radius={10}
      weight={4}
    >
      <Tooltip className="radar-climate-map-label" direction="right" offset={[14, 0]} opacity={1} permanent>
        <span>
          <MapPin size={16} aria-hidden="true" />
          <strong>{locationLabel}</strong>
        </span>
      </Tooltip>
      <Popup>
        <strong>{farm.name}</strong>
        <br />
        {farm.city}, {farm.state}
      </Popup>
    </CircleMarker>
  )
}
