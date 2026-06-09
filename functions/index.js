'use strict'

const { initializeApp } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')
const { onRequest } = require('firebase-functions/v2/https')
const {
  DEFAULT_CEMADEN_SOURCE_URL,
  DEFAULT_MAX_DISTANCE_KM,
  findNearestRainGauge,
} = require('./src/cemaden')

initializeApp()

const sourceUrl = process.env.CEMADEN_SOURCE_URL || DEFAULT_CEMADEN_SOURCE_URL
const maxDistanceKm = Number(process.env.CEMADEN_MAX_DISTANCE_KM) || DEFAULT_MAX_DISTANCE_KM
const sourceCacheTtlMs = 10 * 60 * 1000
let sourceCache = null

function allowCors(request, response) {
  const origin = request.get('origin')
  const allowedOrigins = new Set([
    'https://nimboradar.web.app',
    'https://nimboradar.firebaseapp.com',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ])

  if (origin && allowedOrigins.has(origin)) {
    response.set('Access-Control-Allow-Origin', origin)
    response.set('Vary', 'Origin')
    response.set('Access-Control-Allow-Headers', 'Authorization, Content-Type')
    response.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  }
}

async function verifyUser(request) {
  const authorization = request.get('authorization') || ''
  const match = /^Bearer (.+)$/i.exec(authorization)
  if (!match) return null

  try {
    return await getAuth().verifyIdToken(match[1])
  } catch {
    return null
  }
}

async function getCemadenPayload() {
  if (sourceCache && Date.now() - sourceCache.fetchedAt < sourceCacheTtlMs) {
    return sourceCache.payload
  }

  const response = await fetch(sourceUrl, {
    headers: {
      Accept: 'application/json, application/javascript;q=0.9',
      'User-Agent': 'NibusES/1.0 (+https://nimboradar.web.app)',
    },
    signal: AbortSignal.timeout(15000),
  })

  if (!response.ok) {
    throw new Error(`Cemaden respondeu ${response.status}.`)
  }

  const payload = await response.text()
  sourceCache = { fetchedAt: Date.now(), payload }
  return payload
}

exports.api = onRequest(
  {
    region: 'southamerica-east1',
    timeoutSeconds: 30,
    memory: '256MiB',
    maxInstances: 3,
  },
  async (request, response) => {
    allowCors(request, response)

    if (request.method === 'OPTIONS') {
      response.status(204).send('')
      return
    }

    const path = request.path.replace(/^\/api/, '')
    if (request.method !== 'GET' || path !== '/weather/cemaden') {
      response.status(404).json({ error: 'Rota nao encontrada.' })
      return
    }

    const user = await verifyUser(request)
    if (!user) {
      response.status(401).json({ error: 'Autenticacao Firebase obrigatoria.' })
      return
    }

    try {
      const payload = await getCemadenPayload()
      const gauge = findNearestRainGauge(payload, request.query, maxDistanceKm)

      response.set('Cache-Control', 'private, max-age=300')
      response.status(200).json(gauge)
    } catch (error) {
      console.error('Falha ao consultar Cemaden.', error)
      response.status(502).json({ error: 'Cemaden temporariamente indisponivel.' })
    }
  },
)
