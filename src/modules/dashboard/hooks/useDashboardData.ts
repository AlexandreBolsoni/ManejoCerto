import { useEffect, useMemo, useState } from 'react'
import { useAlerts } from '../../../hooks/useAlerts'
import { useAuth } from '../../../hooks/useAuth'
import { useCurrentFarm } from '../../../hooks/useCurrentFarm'
import { useFields } from '../../../hooks/useFields'
import { useWeather } from '../../../hooks/useWeather'
import { marketService } from '../../../services/marketService'
import { mapClimateToRadarWeather } from '../../../services/weather/weatherMapper'
import type { MarketQuote } from '../../../types'

export function useDashboardData() {
  const { activeAlerts: alerts } = useAlerts()
  const { user } = useAuth()
  const { farm, requestUserLocation, userLocation } = useCurrentFarm()
  const { fields, highRiskFields, userCrops } = useFields()
  const { climate, dashboard, loading, locationError, locationStatus, refreshClimate, staleData } = useWeather()
  const weather = dashboard.weather
  const recommendation = dashboard.recommendations[0]
  const forecastPreview = weather.forecastHours?.slice(0, 12) ?? []
  const farmState = useMemo(() => marketService.resolveState(farm?.state || farm?.locationLabel), [farm?.locationLabel, farm?.state])
  const marketProfile = useMemo(() => marketService.getStateProfile(farmState), [farmState])
  const marketRegion = farm ? marketProfile.stateName : 'Brasil'
  const [marketQuotes, setMarketQuotes] = useState<MarketQuote[]>([])
  const effectiveMarketQuotes = farm ? marketQuotes : []
  const featuredMarket = marketService.selectFeaturedQuote(effectiveMarketQuotes, userCrops)
  const marketPreview = effectiveMarketQuotes.filter((quote) => (userCrops.length > 0 ? userCrops.some((crop) => sameCrop(crop, quote.crop)) : true)).slice(0, 2)
  const firstName = user?.name?.split(' ')[0] ?? 'Alexandre'
  const headerLocation = formatDashboardLocation(marketProfile.stateName, farm?.state, weather.location)
  const visibleFields = highRiskFields.length > 0 ? highRiskFields : fields
  const dashboardRadarData = useMemo(() => (farm ? mapClimateToRadarWeather({ climate: dashboard, farm, zones: [] }) : null), [dashboard, farm])

  useEffect(() => {
    if (!farm) return

    marketService
      .listQuotes(userCrops, marketRegion, farmState)
      .then(setMarketQuotes)
      .catch(() => setMarketQuotes([]))
  }, [farm, farmState, marketRegion, userCrops])

  return {
    alerts,
    climate,
    dashboard,
    dashboardRadarData,
    farm,
    featuredMarket,
    fields,
    firstName,
    forecastPreview,
    headerLocation,
    highRiskFields,
    locationError,
    locationStatus,
    marketPreview,
    recommendation,
    refreshClimate,
    requestUserLocation,
    staleData,
    userLocation,
    visibleFields,
    weather,
    weatherLoading: loading,
  }
}

function normalizeCrop(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\W+/g, '-')
    .replace(/^-|-$/g, '')
}

function sameCrop(left: string, right: string) {
  return normalizeCrop(left) === normalizeCrop(right)
}

function formatDashboardLocation(marketStateName: string, farmState?: string, weatherLocation?: string) {
  const value = [marketStateName, farmState, weatherLocation].find((candidate) => {
    if (!candidate) return false
    const normalized = candidate
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()

    return normalized.includes('espirito santo') || /\bes\b/i.test(candidate)
  })

  if (value) return 'Espírito Santo'

  if (marketStateName && !/[,\d]/.test(marketStateName) && marketStateName !== 'Brasil') {
    return marketStateName
  }

  return 'Espírito Santo'
}
