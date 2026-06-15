import type { Coordinates } from '../types'
import { localStorageAdapter } from './storage'

export type BrazilState = {
  id: number
  uf: string
  name: string
}

export type PlaceKind = 'municipio' | 'distrito' | 'subdistrito'

export type PlaceSearchResult = {
  id: string
  ibgeId: number
  municipalityId: number
  municipalityName: string
  name: string
  state: string
  stateName: string
  kind: PlaceKind
  detail: string
}

type IbgeUf = {
  id: number
  sigla: string
  nome: string
}

type IbgeMunicipality = {
  id: number
  nome: string
  microrregiao?: {
    mesorregiao?: {
      UF?: IbgeUf
    }
  } | null
  'regiao-imediata'?: {
    'regiao-intermediaria'?: {
      UF?: IbgeUf
    }
  }
}

type IbgeDistrict = {
  id: number
  nome: string
  municipio: IbgeMunicipality
}

type IbgeSubdistrict = {
  id: number
  nome: string
  distrito: IbgeDistrict
}

type GeoJsonFeatureCollection = {
  features?: {
    geometry?: {
      coordinates?: unknown
    } | null
  }[]
}

const IBGE_LOCALIDADES_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades'
const IBGE_MALHAS_URL = 'https://servicodados.ibge.gov.br/api/v3/malhas'
const CACHE_VERSION = 'v1'
const placeMemoryCache = new Map<string, PlaceSearchResult[]>()
const coordinatesMemoryCache = new Map<number, Coordinates>()

export const brazilStates: BrazilState[] = [
  { id: 12, uf: 'AC', name: 'Acre' },
  { id: 27, uf: 'AL', name: 'Alagoas' },
  { id: 16, uf: 'AP', name: 'Amapá' },
  { id: 13, uf: 'AM', name: 'Amazonas' },
  { id: 29, uf: 'BA', name: 'Bahia' },
  { id: 23, uf: 'CE', name: 'Ceará' },
  { id: 53, uf: 'DF', name: 'Distrito Federal' },
  { id: 32, uf: 'ES', name: 'Espírito Santo' },
  { id: 52, uf: 'GO', name: 'Goiás' },
  { id: 21, uf: 'MA', name: 'Maranhão' },
  { id: 51, uf: 'MT', name: 'Mato Grosso' },
  { id: 50, uf: 'MS', name: 'Mato Grosso do Sul' },
  { id: 31, uf: 'MG', name: 'Minas Gerais' },
  { id: 15, uf: 'PA', name: 'Pará' },
  { id: 25, uf: 'PB', name: 'Paraíba' },
  { id: 41, uf: 'PR', name: 'Paraná' },
  { id: 26, uf: 'PE', name: 'Pernambuco' },
  { id: 22, uf: 'PI', name: 'Piauí' },
  { id: 33, uf: 'RJ', name: 'Rio de Janeiro' },
  { id: 24, uf: 'RN', name: 'Rio Grande do Norte' },
  { id: 43, uf: 'RS', name: 'Rio Grande do Sul' },
  { id: 11, uf: 'RO', name: 'Rondônia' },
  { id: 14, uf: 'RR', name: 'Roraima' },
  { id: 42, uf: 'SC', name: 'Santa Catarina' },
  { id: 35, uf: 'SP', name: 'São Paulo' },
  { id: 28, uf: 'SE', name: 'Sergipe' },
  { id: 17, uf: 'TO', name: 'Tocantins' },
]

function stateNameFromUf(uf: string) {
  return brazilStates.find((state) => state.uf === uf)?.name ?? uf
}

function ufFromMunicipality(municipality: IbgeMunicipality) {
  return municipality.microrregiao?.mesorregiao?.UF?.sigla ?? municipality['regiao-imediata']?.['regiao-intermediaria']?.UF?.sigla ?? ''
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

async function getJson<T>(url: string) {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Falha ao consultar localidade (${response.status}).`)
  }

  return response.json() as Promise<T>
}

function cacheKey(uf: string) {
  return `nimbo:places:${CACHE_VERSION}:${uf}`
}

function coordinatesCacheKey(municipalityId: number) {
  return `nimbo:place-coordinates:${CACHE_VERSION}:${municipalityId}`
}

function loadPlacesFromCache(uf: string) {
  return localStorageAdapter.getJson<PlaceSearchResult[]>(cacheKey(uf))
}

function savePlacesToCache(uf: string, places: PlaceSearchResult[]) {
  localStorageAdapter.setJson(cacheKey(uf), places)
}

function loadCoordinatesFromCache(municipalityId: number) {
  return localStorageAdapter.getJson<Coordinates>(coordinatesCacheKey(municipalityId))
}

function saveCoordinatesToCache(municipalityId: number, coordinates: Coordinates) {
  localStorageAdapter.setJson(coordinatesCacheKey(municipalityId), coordinates)
}

function mapMunicipality(item: IbgeMunicipality, uf: string): PlaceSearchResult {
  return {
    id: `municipio-${item.id}`,
    ibgeId: item.id,
    municipalityId: item.id,
    municipalityName: item.nome,
    name: item.nome,
    state: uf,
    stateName: stateNameFromUf(uf),
    kind: 'municipio',
    detail: 'Município',
  }
}

function mapDistrict(item: IbgeDistrict, uf: string): PlaceSearchResult {
  return {
    id: `distrito-${item.id}`,
    ibgeId: item.id,
    municipalityId: item.municipio.id,
    municipalityName: item.municipio.nome,
    name: item.nome,
    state: uf,
    stateName: stateNameFromUf(uf),
    kind: 'distrito',
    detail: `Distrito ou vila de ${item.municipio.nome}`,
  }
}

function mapSubdistrict(item: IbgeSubdistrict, uf: string): PlaceSearchResult {
  return {
    id: `subdistrito-${item.id}`,
    ibgeId: item.id,
    municipalityId: item.distrito.municipio.id,
    municipalityName: item.distrito.municipio.nome,
    name: item.nome,
    state: uf,
    stateName: stateNameFromUf(uf),
    kind: 'subdistrito',
    detail: `Subdistrito em ${item.distrito.municipio.nome}`,
  }
}

function dedupePlaces(places: PlaceSearchResult[]) {
  const seen = new Set<string>()

  return places.filter((place) => {
    const key = `${place.kind}:${normalizeText(place.name)}:${place.municipalityId}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function byKindAndName(a: PlaceSearchResult, b: PlaceSearchResult) {
  const order: Record<PlaceKind, number> = { municipio: 0, distrito: 1, subdistrito: 2 }
  return order[a.kind] - order[b.kind] || a.name.localeCompare(b.name, 'pt-BR')
}

async function listStatePlaces(uf: string) {
  const normalizedUf = uf.toUpperCase()
  const cached = placeMemoryCache.get(normalizedUf) ?? loadPlacesFromCache(normalizedUf)
  if (cached) {
    placeMemoryCache.set(normalizedUf, cached)
    return cached
  }

  const [municipalitiesResult, districtsResult, subdistrictsResult] = await Promise.allSettled([
    getJson<IbgeMunicipality[]>(`${IBGE_LOCALIDADES_URL}/estados/${normalizedUf}/municipios?orderBy=nome`),
    getJson<IbgeDistrict[]>(`${IBGE_LOCALIDADES_URL}/estados/${normalizedUf}/distritos?orderBy=nome`),
    getJson<IbgeSubdistrict[]>(`${IBGE_LOCALIDADES_URL}/estados/${normalizedUf}/subdistritos?orderBy=nome`),
  ])

  const municipalities = municipalitiesResult.status === 'fulfilled' ? municipalitiesResult.value : []
  const municipalityPlaces = municipalities.map((item) => mapMunicipality(item, normalizedUf))
  const municipalityNameKeys = new Set(municipalities.map((item) => `${normalizeText(item.nome)}:${item.id}`))
  const districts =
    districtsResult.status === 'fulfilled'
      ? districtsResult.value
          .filter((item) => ufFromMunicipality(item.municipio) === normalizedUf)
          .filter((item) => !municipalityNameKeys.has(`${normalizeText(item.nome)}:${item.municipio.id}`))
          .map((item) => mapDistrict(item, normalizedUf))
      : []
  const subdistricts =
    subdistrictsResult.status === 'fulfilled'
      ? subdistrictsResult.value
          .filter((item) => ufFromMunicipality(item.distrito.municipio) === normalizedUf)
          .filter((item) => normalizeText(item.nome) !== normalizeText(item.distrito.nome))
          .map((item) => mapSubdistrict(item, normalizedUf))
      : []

  const places = dedupePlaces([...municipalityPlaces, ...districts, ...subdistricts]).sort(byKindAndName)
  placeMemoryCache.set(normalizedUf, places)
  savePlacesToCache(normalizedUf, places)

  return places
}

function collectPositions(value: unknown, positions: [number, number][]) {
  if (!Array.isArray(value)) return

  if (typeof value[0] === 'number' && typeof value[1] === 'number') {
    positions.push([value[0], value[1]])
    return
  }

  value.forEach((item) => collectPositions(item, positions))
}

function coordinatesFromGeoJson(geoJson: GeoJsonFeatureCollection): Coordinates | null {
  const positions: [number, number][] = []
  geoJson.features?.forEach((feature) => collectPositions(feature.geometry?.coordinates, positions))

  if (positions.length === 0) return null

  const bounds = positions.reduce(
    (current, [longitude, latitude]) => ({
      maxLatitude: Math.max(current.maxLatitude, latitude),
      maxLongitude: Math.max(current.maxLongitude, longitude),
      minLatitude: Math.min(current.minLatitude, latitude),
      minLongitude: Math.min(current.minLongitude, longitude),
    }),
    {
      maxLatitude: -Infinity,
      maxLongitude: -Infinity,
      minLatitude: Infinity,
      minLongitude: Infinity,
    },
  )

  return {
    latitude: (bounds.minLatitude + bounds.maxLatitude) / 2,
    longitude: (bounds.minLongitude + bounds.maxLongitude) / 2,
    accuracyM: 18000,
    source: 'ibge',
    updatedAt: new Date().toISOString(),
  }
}

async function getPlaceCoordinates(place: PlaceSearchResult) {
  const cached = coordinatesMemoryCache.get(place.municipalityId) ?? loadCoordinatesFromCache(place.municipalityId)
  if (cached) {
    const coordinates = { ...cached, updatedAt: new Date().toISOString() }
    coordinatesMemoryCache.set(place.municipalityId, coordinates)
    return coordinates
  }

  const geoJson = await getJson<GeoJsonFeatureCollection>(
    `${IBGE_MALHAS_URL}/municipios/${place.municipalityId}?formato=application/vnd.geo+json&qualidade=minima`,
  )
  const coordinates = coordinatesFromGeoJson(geoJson)
  if (!coordinates) return null

  const withAccuracy = {
    ...coordinates,
    accuracyM: place.kind === 'municipio' ? 12000 : 18000,
  }

  coordinatesMemoryCache.set(place.municipalityId, withAccuracy)
  saveCoordinatesToCache(place.municipalityId, withAccuracy)

  return withAccuracy
}

async function searchPlaces(uf: string, query: string, limit = 12) {
  const term = normalizeText(query)
  if (!uf || term.length < 2) return []

  const places = await listStatePlaces(uf)
  const matches = places
    .map((place) => {
      const searchable = normalizeText(`${place.name} ${place.municipalityName} ${place.detail}`)
      const name = normalizeText(place.name)
      const score = name === term ? 0 : name.startsWith(term) ? 1 : searchable.includes(term) ? 2 : 99
      return { place, score }
    })
    .filter((item) => item.score < 99)
    .sort((a, b) => a.score - b.score || byKindAndName(a.place, b.place))
    .slice(0, limit)

  return matches.map((item) => item.place)
}

export function placeKindLabel(kind: PlaceKind) {
  if (kind === 'municipio') return 'Município'
  if (kind === 'distrito') return 'Vila/Distrito'
  return 'Subdistrito'
}

export const placeSearchService = {
  getPlaceCoordinates,
  listStatePlaces,
  searchPlaces,
}
