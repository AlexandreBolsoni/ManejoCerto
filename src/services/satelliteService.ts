export type SatelliteLayerInfo = {
  tileUrl: string
  date: string
  dateLabel: string
  label: string
  source: 'NASA_GIBS'
  isNearRealTime: false
  maxNativeZoom: number
}

const GIBS_SATELLITE_LAYER = 'VIIRS_SNPP_CorrectedReflectance_TrueColor'
export const GIBS_SATELLITE_MAX_NATIVE_ZOOM = 9

function defaultSatelliteDate() {
  const yesterdayUtc = new Date(Date.now() - 24 * 60 * 60 * 1000)
  return yesterdayUtc.toISOString().slice(0, 10)
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export const satelliteService = {
  getLayerInfo(date = defaultSatelliteDate()): SatelliteLayerInfo {
    return {
      tileUrl: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${GIBS_SATELLITE_LAYER}/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
      date,
      dateLabel: formatDate(date),
      label: `Imagem diária de ${formatDate(date)}`,
      source: 'NASA_GIBS',
      isNearRealTime: false,
      maxNativeZoom: GIBS_SATELLITE_MAX_NATIVE_ZOOM,
    }
  },
}
