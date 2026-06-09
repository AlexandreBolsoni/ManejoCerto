'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const { distanceKm, findNearestRainGauge, parseCemadenPayload } = require('../src/cemaden')

const payload = `estacoes([{
  "atualizado": "2026-06-07 09:52:38 UTC",
  "estacao": [
    {
      "acumulado": 12.4,
      "cidade": "VITORIA",
      "codestacao": "320530901A",
      "idestacao": 123,
      "idtipoestacao": 1,
      "latitude": -20.31,
      "longitude": -40.31,
      "nomeestacao": "Centro",
      "status": 0,
      "uf": "ES"
    },
    {
      "acumulado": 2,
      "cidade": "SAO PAULO",
      "codestacao": "355030801A",
      "idestacao": 456,
      "idtipoestacao": 1,
      "latitude": -23.55,
      "longitude": -46.63,
      "nomeestacao": "Se",
      "status": 0,
      "uf": "SP"
    }
  ]
}]);`

test('interpreta o JSONP publicado pelo mapa do Cemaden', () => {
  const result = parseCemadenPayload(payload)

  assert.equal(result.observedAt, '2026-06-07T09:52:38.000Z')
  assert.equal(result.stations.length, 2)
})

test('normaliza o pluviometro mais proximo no mesmo estado', () => {
  const result = findNearestRainGauge(payload, {
    latitude: '-20.30',
    longitude: '-40.30',
    state: 'ES',
  })

  assert.equal(result.stationCode, '320530901A')
  assert.equal(result.stationName, 'Centro')
  assert.equal(result.accumulatedMm.hours24, 12.4)
  assert.ok(result.distanceKm < 5)
})

test('nao devolve uma estacao distante alem do limite operacional', () => {
  const result = findNearestRainGauge(payload, {
    latitude: '-12.97',
    longitude: '-38.50',
    state: 'BA',
  })

  assert.equal(result, null)
})

test('ignora estacao sem acumulado valido', () => {
  const withoutReading = payload.replace('"acumulado": 12.4', '"acumulado": null')
  const result = findNearestRainGauge(withoutReading, {
    latitude: '-20.30',
    longitude: '-40.30',
    state: 'ES',
  })

  assert.equal(result, null)
})

test('calcula distancia geografica em quilometros', () => {
  const distance = distanceKm(-20.31, -40.31, -20.32, -40.32)
  assert.ok(distance > 1 && distance < 2)
})
