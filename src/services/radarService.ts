export type RadarFrame = {
  time: number
  path: string
  type: 'past' | 'nowcast'
  tileUrl: string
}

export type RadarMetadata = {
  host: string
  generatedAt: number
  updatedAtLabel: string
  frames: RadarFrame[]
  status: 'available' | 'cached' | 'unavailable'
}

type RainViewerFrame = {
  time: number
  path: string
}

type RainViewerResponse = {
  host: string
  generated: number
  radar?: {
    past?: RainViewerFrame[]
    nowcast?: RainViewerFrame[]
  }
}

export const RAINVIEWER_MAX_NATIVE_ZOOM = 7
export const RAINVIEWER_REFRESH_INTERVAL = 5 * 60 * 1000

const CACHE_KEY = 'nimbo:rainviewer-metadata:v2'
const CACHE_MAX_AGE_MS = 30 * 60 * 1000
const REQUEST_TIMEOUT_MS = 8_000
const RAINVIEWER_METADATA_URL = 'https://api.rainviewer.com/public/weather-maps.json'

function storageAvailable() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

function updatedAtLabel(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function tileUrl(host: string, path: string) {
  return `${host}${path}/256/{z}/{x}/{y}/2/1_1.png`
}

function normalizeFrames(host: string, response: RainViewerResponse) {
  const normalize = (frames: RainViewerFrame[], type: RadarFrame['type']) =>
    frames.map((frame) => ({
      ...frame,
      type,
      tileUrl: tileUrl(host, frame.path),
    }))

  return [
    ...normalize(response.radar?.past ?? [], 'past'),
    ...normalize(response.radar?.nowcast ?? [], 'nowcast'),
  ]
}

function loadCachedMetadata(): RadarMetadata | null {
  if (!storageAvailable()) return null

  try {
    const stored = window.sessionStorage.getItem(CACHE_KEY)
    if (!stored) return null
    const metadata = JSON.parse(stored) as RadarMetadata
    if (Date.now() - metadata.generatedAt * 1000 > CACHE_MAX_AGE_MS) return null
    return { ...metadata, status: 'cached' }
  } catch {
    return null
  }
}

function saveCachedMetadata(metadata: RadarMetadata) {
  if (!storageAvailable()) return

  try {
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(metadata))
  } catch {
    // Cache best-effort only.
  }
}

const unavailableRadar: RadarMetadata = {
  host: 'https://tilecache.rainviewer.com',
  generatedAt: Math.floor(Date.now() / 1000),
  updatedAtLabel: 'indisponível',
  frames: [],
  status: 'unavailable',
}

export const radarService = {
  async getRadarMetadata(): Promise<RadarMetadata> {
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch(RAINVIEWER_METADATA_URL, {
        cache: 'no-store',
        signal: controller.signal,
      })
      if (!response.ok) throw new Error(`RainViewer respondeu ${response.status}`)
      const data = (await response.json()) as RainViewerResponse
      const metadata: RadarMetadata = {
        host: data.host,
        generatedAt: data.generated,
        updatedAtLabel: updatedAtLabel(data.generated),
        frames: normalizeFrames(data.host, data),
        status: 'available',
      }
      saveCachedMetadata(metadata)
      return metadata
    } catch (error) {
      const cached = loadCachedMetadata()
      console.warn('Nao foi possivel carregar radar RainViewer.', error)
      return cached ?? unavailableRadar
    } finally {
      window.clearTimeout(timeoutId)
    }
  },

  tileUrl(metadata: RadarMetadata, frame: RadarFrame | undefined) {
    if (!frame) return ''
    return frame.tileUrl || tileUrl(metadata.host, frame.path)
  },
}
