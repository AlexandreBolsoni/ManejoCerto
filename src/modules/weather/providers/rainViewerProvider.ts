import { radarService, type RadarMetadata } from '../../../services/radarService'
import { createProviderStatus, type WeatherProviderAdapter } from './types'

export const rainViewerProvider: WeatherProviderAdapter<void, RadarMetadata> = {
  id: 'rainviewer',
  role: 'visual',
  getData: () => radarService.getRadarMetadata(),
  getStatus: () => createProviderStatus('rainviewer', 'visual'),
}
