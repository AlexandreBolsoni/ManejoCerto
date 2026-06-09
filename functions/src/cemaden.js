'use strict'

const DEFAULT_CEMADEN_SOURCE_URL = 'https://resources.cemaden.gov.br/dados/311_24.json'
const DEFAULT_MAX_DISTANCE_KM = 150

function parseCemadenPayload(payload) {
  const trimmed = payload.trim()
  const match = /^estacoes\(([\s\S]*)\);?$/.exec(trimmed)
  const parsed = JSON.parse(match ? match[1] : trimmed)
  const root = Array.isArray(parsed) ? parsed[0] : parsed

  return {
    observedAt: parseObservedAt(root?.atualizado),
    stations: Array.isArray(root?.estacao) ? root.estacao : [],
  }
}

function parseObservedAt(value) {
  if (typeof value !== 'string') return new Date().toISOString()

  const normalized = value.trim().replace(' UTC', 'Z').replace(' ', 'T')
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString()
}

function toRadians(value) {
  return (value * Math.PI) / 180
}

function distanceKm(fromLatitude, fromLongitude, toLatitude, toLongitude) {
  const earthRadiusKm = 6371
  const latitudeDelta = toRadians(toLatitude - fromLatitude)
  const longitudeDelta = toRadians(toLongitude - fromLongitude)
  const fromLatitudeRadians = toRadians(fromLatitude)
  const toLatitudeRadians = toRadians(toLatitude)
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitudeRadians) * Math.cos(toLatitudeRadians) * Math.sin(longitudeDelta / 2) ** 2

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
}

function findNearestRainGauge(payload, query, maxDistanceKm = DEFAULT_MAX_DISTANCE_KM) {
  const { observedAt, stations } = parseCemadenPayload(payload)
  const state = query.state?.trim().toUpperCase()
  const latitude = Number(query.latitude)
  const longitude = Number(query.longitude)

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('Latitude e longitude validas sao obrigatorias.')
  }

  const candidates = stations
    .filter((station) => station?.status === 0 && station?.idtipoestacao === 1)
    .filter((station) => !state || station.uf === state)
    .filter((station) => Number.isFinite(station.latitude) && Number.isFinite(station.longitude))
    .filter((station) => Number.isFinite(station.acumulado))
    .map((station) => ({
      station,
      distanceKm: distanceKm(latitude, longitude, station.latitude, station.longitude),
    }))
    .sort((left, right) => left.distanceKm - right.distanceKm)

  const nearest = candidates[0]
  if (!nearest || nearest.distanceKm > maxDistanceKm) return null

  const accumulated24h = nearest.station.acumulado

  return {
    stationCode: nearest.station.codestacao,
    stationName: nearest.station.nomeestacao,
    city: nearest.station.cidade,
    state: nearest.station.uf,
    latitude: nearest.station.latitude,
    longitude: nearest.station.longitude,
    observedAt,
    distanceKm: Number(nearest.distanceKm.toFixed(1)),
    accumulatedMm: {
      hours24: accumulated24h,
    },
    qualification: 'Dado bruto da rede de monitoramento do Cemaden.',
    sourceUrl: `https://resources.cemaden.gov.br/graficos/interativo/grafico_CEMADEN.php?idpcd=${nearest.station.idestacao}&uf=${nearest.station.uf}`,
  }
}

module.exports = {
  DEFAULT_CEMADEN_SOURCE_URL,
  DEFAULT_MAX_DISTANCE_KM,
  distanceKm,
  findNearestRainGauge,
  parseCemadenPayload,
}
