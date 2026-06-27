import * as L from 'leaflet'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft, ArrowRight, LocateFixed, MapPin, Search } from 'lucide-react'
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { useNavigate } from 'react-router-dom'
import { Button, LinkButton } from '../../components/ui'
import { TextAreaField, TextField } from '../../components/ui'
import { APP_STATE, APP_STATE_NAME } from '../../config/brand'
import { useCurrentFarm } from '../../hooks/useCurrentFarm'
import { useWeather } from '../../hooks/useWeather'
import { marketService } from '../../services/marketService'
import { placeKindLabel, placeSearchService, type PlaceSearchResult } from '../../services/placeSearchService'
import type { Coordinates, Farm } from '../../types'

const espiritoSantoCenter: L.LatLngTuple = [-19.55, -40.5]
const farmPinIcon = L.divIcon({
  className: 'farm-pin-marker',
  html: '<span></span>',
  iconAnchor: [17, 40],
  iconSize: [34, 42],
  popupAnchor: [0, -38],
})

function coordinateLabel(coordinates: Coordinates) {
  return `${coordinates.latitude.toFixed(5)}, ${coordinates.longitude.toFixed(5)}`
}

function manualCoordinates(latitude: number, longitude: number): Coordinates {
  return {
    latitude,
    longitude,
    accuracyM: 25,
    source: 'manual',
    updatedAt: new Date().toISOString(),
  }
}

function RecenterSetupMap({ coordinates }: { coordinates: Coordinates | null }) {
  const map = useMap()

  useEffect(() => {
    if (!coordinates) return
    map.setView([coordinates.latitude, coordinates.longitude], Math.max(map.getZoom(), 12), { animate: true })
  }, [coordinates, map])

  return null
}

function MapClickHandler({ onChange }: { onChange: (coordinates: Coordinates) => void }) {
  useMapEvents({
    click(event) {
      onChange(manualCoordinates(event.latlng.lat, event.latlng.lng))
    },
  })

  return null
}

function DraggableFarmMarker({
  coordinates,
  label,
  onChange,
}: {
  coordinates: Coordinates
  label: string
  onChange: (coordinates: Coordinates) => void
}) {
  const markerRef = useRef<L.Marker | null>(null)
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current
        if (!marker) return

        const position = marker.getLatLng()
        onChange(manualCoordinates(position.lat, position.lng))
      },
    }),
    [onChange],
  )

  return (
    <Marker
      draggable
      eventHandlers={eventHandlers}
      icon={farmPinIcon}
      position={[coordinates.latitude, coordinates.longitude]}
      ref={markerRef}
    >
      <Popup>
        <strong>Ponto da fazenda</strong>
        <br />
        {label || coordinateLabel(coordinates)}
      </Popup>
    </Marker>
  )
}

function FarmSetupMap({
  coordinates,
  label,
  onChange,
}: {
  coordinates: Coordinates | null
  label: string
  onChange: (coordinates: Coordinates) => void
}) {
  const center: L.LatLngTuple = coordinates ? [coordinates.latitude, coordinates.longitude] : espiritoSantoCenter

  return (
    <div className="farm-map-card real-location-map">
      <MapContainer center={center} className="farm-setup-leaflet" scrollWheelZoom zoom={coordinates ? 12 : 7}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onChange={onChange} />
        <RecenterSetupMap coordinates={coordinates} />
        {coordinates ? <DraggableFarmMarker coordinates={coordinates} label={label} onChange={onChange} /> : null}
      </MapContainer>
      <div className="farm-map-toolbar">
        <span>Mapa real</span>
        <span>Pino ajustável</span>
      </div>
      <div className="map-caption farm-location-caption">
        <MapPin size={20} aria-hidden="true" />
        <div>
          <strong>{coordinates ? 'Localização da fazenda definida' : 'Defina o ponto da fazenda'}</strong>
          <span>{coordinates ? `${label || coordinateLabel(coordinates)} · arraste para refinar` : 'Escolha uma localidade ou clique no mapa'}</span>
        </div>
      </div>
    </div>
  )
}

export function NewFarmPage() {
  const navigate = useNavigate()
  const { requestUserLocation, saveFarm, userLocation } = useCurrentFarm()
  const { locationError, locationStatus } = useWeather()
  
  // Modificado: estado agora é um array de strings
  const [selectedCrops, setSelectedCrops] = useState<string[]>([])
  const [customProduction, setCustomProduction] = useState('')
  const [productionError, setProductionError] = useState('')
  
  const [placeQuery, setPlaceQuery] = useState('')
  const [placeResults, setPlaceResults] = useState<PlaceSearchResult[]>([])
  const [placeLoading, setPlaceLoading] = useState(false)
  const [placeResolving, setPlaceResolving] = useState(false)
  const [placeError, setPlaceError] = useState('')
  const [selectedPlace, setSelectedPlace] = useState<PlaceSearchResult | null>(null)
  const [draft, setDraft] = useState<Farm>({
    id: '',
    name: '',
    locality: '',
    municipality: '',
    state: APP_STATE,
    locationLabel: '',
    productionType: '',
    areaHa: 0,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo',
    notes: '',
  })

  const mapLabel = useMemo(() => {
    if (!draft.coordinates) return ''
    return draft.locationLabel || coordinateLabel(draft.coordinates)
  }, [draft.coordinates, draft.locationLabel])
  
  const productionTypes = useMemo(() => marketService.productionTypesForState(APP_STATE), [])

  // Nova função para alternar seleção múltipla de culturas
  const toggleCrop = (crop: string) => {
    setSelectedCrops((prev) =>
      prev.includes(crop)
        ? prev.filter((c) => c !== crop)
        : [...prev, crop]
    )
    setProductionError('')
  }

  const applyCoordinates = useCallback((coordinates: Coordinates, label?: string) => {
    setDraft((current) => ({
      ...current,
      coordinates,
      locationLabel: label ?? (selectedPlace ? `${selectedPlace.name}, ${APP_STATE}` : current.locationLabel || coordinateLabel(coordinates)),
    }))
  }, [selectedPlace])

  useEffect(() => {
    let cancelled = false

    if (placeQuery.trim().length < 2 || selectedPlace?.name === placeQuery.trim()) {
      return () => {
        cancelled = true
      }
    }

    const timeoutId = window.setTimeout(() => {
      placeSearchService
        .searchPlaces(APP_STATE, placeQuery)
        .then((places) => {
          if (!cancelled) setPlaceResults(places)
        })
        .catch(() => {
          if (!cancelled) {
            setPlaceResults([])
            setPlaceError('Não foi possível buscar localidades agora. Tente novamente em alguns instantes.')
          }
        })
        .finally(() => {
          if (!cancelled) setPlaceLoading(false)
        })
    }, 280)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [placeQuery, selectedPlace])

  const changePlaceQuery = (value: string) => {
    setPlaceQuery(value)
    setSelectedPlace(null)
    setPlaceLoading(value.trim().length >= 2)
    setPlaceError('')
    setDraft((current) => ({
      ...current,
      locality: value,
      localityKind: 'povoado',
      municipality: value,
      municipalityId: undefined,
    }))
  }

  const selectPlace = async (place: PlaceSearchResult) => {
    setSelectedPlace(place)
    setPlaceQuery(place.name)
    setPlaceResults([])
    setPlaceLoading(false)
    setPlaceError('')
    setPlaceResolving(true)
    setDraft((current) => ({
      ...current,
      locality: place.name,
      localityKind: place.kind,
      locationLabel: `${place.name}, ${APP_STATE}`,
      municipality: place.municipalityName,
      municipalityId: place.municipalityId,
      state: APP_STATE,
    }))

    try {
      const coordinates = await placeSearchService.getPlaceCoordinates(place)
      if (!coordinates) {
        setPlaceError('Localidade encontrada, mas o mapa não retornou coordenadas. Clique no mapa para marcar a fazenda.')
        return
      }

      applyCoordinates(coordinates, `${place.name}, ${APP_STATE}`)
    } catch {
      setPlaceError('Localidade encontrada, mas não foi possível centralizar o mapa. Clique no mapa para marcar a fazenda.')
    } finally {
      setPlaceResolving(false)
    }
  }

  const captureCurrentLocation = async () => {
    const coordinates = await requestUserLocation()
    if (!coordinates) return

    setSelectedPlace(null)
    setPlaceResults([])
    applyCoordinates(coordinates, `${coordinateLabel(coordinates)} · localização do navegador`)
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()

    // Validação de seleção múltipla
    if (selectedCrops.length === 0) {
      setProductionError('Escolha pelo menos um tipo de produção para continuar.')
      return
    }

    if (selectedCrops.includes('Outros') && !customProduction.trim()) {
      setProductionError('Descreva o tipo de produção para continuar.')
      return
    }

    if (!draft.coordinates) {
      setPlaceError('Defina o ponto da fazenda no mapa antes de continuar.')
      return
    }

    const id =
      draft.id ||
      draft.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\W+/g, '-')
        .replace(/^-|-$/g, '') ||
      crypto.randomUUID()

    // Formata o resultado final com todos os selecionados separados por vírgula
    const finalProductionTypes = selectedCrops
      .filter((c) => c !== 'Outros')
      .concat(selectedCrops.includes('Outros') ? customProduction.trim() : [])
      .join(', ')

    const nextFarm = {
      ...draft,
      areaHa: Number(draft.areaHa) || 0,
      id,
      locationLabel: draft.locationLabel || coordinateLabel(draft.coordinates),
      locality: placeQuery.trim(),
      municipality: draft.municipality.trim(),
      name: draft.name.trim(),
      productionType: finalProductionTypes, // String combinada
      state: APP_STATE,
    }

    void saveFarm(nextFarm).then(() => navigate('/dashboard'))
  }

  return (
    <main className="setup-page">
      <form className="farm-setup-grid" onSubmit={submit}>
        <div className="setup-copy">
          <p className="eyebrow">PASSO 1 DE 2</p>
          <h1>Cadastre sua fazenda</h1>
          <p>A localização salva aqui será a base para chuva, vento, radar e recomendações por área de cultivo.</p>
        </div>

        <FarmSetupMap coordinates={draft.coordinates ?? null} label={mapLabel} onChange={(coordinates) => applyCoordinates(coordinates)} />

        <div className="setup-form-column">
          <section className="form-card">
            <TextField
              label="NOME DA FAZENDA *"
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              placeholder="Ex.: Fazenda Primavera"
              required
              value={draft.name}
            />
            <TextField
              label="ÁREA (HA)"
              min="1"
              onChange={(event) => setDraft({ ...draft, areaHa: Number(event.target.value) })}
              placeholder="0"
              type="number"
              value={draft.areaHa || ''}
            />
            <label className="form-field with-icon place-search-field">
              <span>CIDADE, MUNICÍPIO, DISTRITO, VILA OU POVOADO *</span>
              <div>
                <Search size={18} aria-hidden="true" />
                <input
                  aria-autocomplete="list"
                  aria-expanded={placeResults.length > 0}
                  onChange={(event) => changePlaceQuery(event.target.value)}
                  placeholder={`Buscar localidade no ${APP_STATE_NAME}...`}
                  required
                  value={placeQuery}
                />
              </div>
            </label>
            <p className="form-hint neutral">Atendimento exclusivo no Espírito Santo. Se o povoado não aparecer, digite o nome e marque o ponto no mapa.</p>
            {placeLoading ? <p className="form-hint neutral">Buscando localidades capixabas...</p> : null}
            {placeResolving ? <p className="form-hint neutral">Centralizando o mapa nessa localidade...</p> : null}
            {placeResults.length > 0 ? (
              <div className="place-results" role="listbox">
                {placeResults.map((place) => (
                  <button key={place.id} onClick={() => void selectPlace(place)} role="option" type="button">
                    <span>
                      <strong>{place.name}</strong>
                      <small>{place.detail}</small>
                    </span>
                    <em>{placeKindLabel(place.kind)}</em>
                  </button>
                ))}
              </div>
            ) : null}
            {placeError ? <p className="form-hint danger">{placeError}</p> : null}
            <TextField
              label="LOCALIZAÇÃO APROXIMADA"
              onChange={(event) => setDraft({ ...draft, locationLabel: event.target.value })}
              placeholder="Ex.: comunidade rural, estrada, coordenadas ou referência local"
              value={draft.locationLabel}
            />
            <Button onClick={() => void captureCurrentLocation()} type="button" variant="secondary">
              <LocateFixed size={18} aria-hidden="true" />
              {locationStatus === 'requesting' ? 'Buscando localização...' : 'Usar localização do navegador'}
            </Button>
            {userLocation ? (
              <p className="form-hint neutral">Local do navegador disponível com precisão aproximada de ±{Math.round(userLocation.accuracyM ?? 0)} m.</p>
            ) : null}
            {locationError ? <p className="form-hint danger">{locationError}</p> : null}
            <TextField
              label="FUSO HORÁRIO"
              onChange={(event) => setDraft({ ...draft, timezone: event.target.value })}
              value={draft.timezone}
            />
            <TextAreaField
              label="OBSERVAÇÕES OPCIONAIS"
              onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
              placeholder="Ex.: áreas com pivô central, regiões de baixada, glebas sensíveis..."
              value={draft.notes ?? ''}
            />
          </section>

          <section className="form-card">
            <span className="form-section-label">TIPO DE PRODUÇÃO *</span>
            <div className="chip-grid">
              {productionTypes.map((crop) => (
                <button
                  className={selectedCrops.includes(crop) ? 'selected' : ''}
                  key={crop}
                  onClick={() => toggleCrop(crop)}
                  type="button"
                >
                  {crop}
                </button>
              ))}
              <button
                className={selectedCrops.includes('Outros') ? 'selected' : ''}
                onClick={() => toggleCrop('Outros')}
                type="button"
              >
                Outros
              </button>
            </div>
            {selectedCrops.includes('Outros') ? (
              <TextField
                label="DESCREVA O TIPO DE PRODUÇÃO *"
                onChange={(event) => {
                  setCustomProduction(event.target.value)
                  setProductionError('')
                }}
                placeholder="Ex.: apicultura, piscicultura, flores, agrofloresta..."
                required
                value={customProduction}
              />
            ) : null}
            {productionError ? <p className="form-hint danger">{productionError}</p> : null}
          </section>

          <div className="setup-actions">
            <LinkButton to="/login" variant="secondary">
              <ArrowLeft size={17} aria-hidden="true" />
              Voltar
            </LinkButton>
            <Button className="wide" type="submit">
              Salvar e continuar <ArrowRight size={17} aria-hidden="true" />
            </Button>
          </div>
        </div>
      </form>
    </main>
  )
}