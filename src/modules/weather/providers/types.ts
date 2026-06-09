import type { WeatherLayerRole, WeatherProvider, WeatherProviderStatus } from '../types'

export type WeatherProviderAdapter<TInput, TOutput> = {
  id: WeatherProvider
  role: WeatherLayerRole
  getData: (input: TInput) => Promise<TOutput>
  getStatus: () => WeatherProviderStatus
}

export function createProviderStatus(provider: WeatherProvider, role: WeatherLayerRole): WeatherProviderStatus {
  return {
    provider,
    status: role === 'operational' || role === 'validation' || role === 'visual' ? 'online' : 'not_configured',
  }
}
