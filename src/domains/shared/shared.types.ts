export type Severity = 'critico' | 'alto' | 'moderado' | 'baixo'

export type SourceStatus = 'fresh' | 'stale' | 'partial' | 'offline'

export type Coordinates = {
  latitude: number
  longitude: number
  accuracyM?: number
  altitudeM?: number | null
  source?: 'usuario' | 'fazenda' | 'manual' | 'radar' | 'rede' | 'ibge'
  updatedAt?: string
}
