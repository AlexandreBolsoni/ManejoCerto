import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { APP_STATE } from '../../../config/brand'
import { useFields } from '../../../hooks/useFields'
import { useWeather } from '../../../hooks/useWeather'
import { marketService } from '../../../services/marketService'
import type { MarketPeriod, MarketQuote } from '../../../types'
import type { MarketCompareMode, MarketDetailTab, MarketFilter } from '../types/marketPage.types'
import { filterQuotes, hasUsableSeries, marketAdvancedCards, marketClimateRows, marketInsights, sameCrop } from '../utils/marketView'

export function useMarketPage() {
  const { fields, userCrops } = useFields()
  const { climate } = useWeather()
  const [searchParams, setSearchParams] = useSearchParams()
  const [quotes, setQuotes] = useState<MarketQuote[]>([])
  const [selectedCrop, setSelectedCrop] = useState(searchParams.get('cultura') ?? 'Café Conilon')
  const [activeFilter, setActiveFilter] = useState<MarketFilter>('all')
  const [detailTab, setDetailTab] = useState<MarketDetailTab>('summary')
  const [compareMode, setCompareMode] = useState<MarketCompareMode>('price')
  const [showClimateImpact, setShowClimateImpact] = useState(false)
  const [chartPeriod, setChartPeriod] = useState<MarketPeriod>('weekly')
  const [newCrop, setNewCrop] = useState('Café Conilon')
  const [loading, setLoading] = useState(true)
  const activeState = APP_STATE
  const activeProfile = useMemo(() => marketService.getStateProfile(activeState), [activeState])
  const marketRegion = activeProfile.stateName
  const filteredQuotes = useMemo(() => filterQuotes(quotes, activeFilter, userCrops), [activeFilter, quotes, userCrops])
  const selectedQuote = useMemo(
    () => filteredQuotes.find((quote) => sameCrop(quote.crop, selectedCrop)) ?? marketService.selectFeaturedQuote(filteredQuotes, userCrops) ?? filteredQuotes[0] ?? null,
    [filteredQuotes, selectedCrop, userCrops],
  )
  const todayQuotes = filteredQuotes.slice(0, 8)
  const comparisonQuotes = filteredQuotes.slice(0, 10)
  const officialSources = marketService.officialSources()
  const sourceCards = officialSources.filter((source) => source.priority === 'base').slice(0, 6)
  const selectedChartPoints = selectedQuote?.historyByPeriod?.[chartPeriod] ?? []
  const chartHasRealSeries = hasUsableSeries(selectedChartPoints, chartPeriod)
  const quickInsights = selectedQuote ? marketInsights(selectedQuote, chartPeriod) : []
  const climateRows = useMemo(() => marketClimateRows(climate?.weather.forecastHours), [climate?.weather.forecastHours])
  const advancedCards = selectedQuote ? marketAdvancedCards(selectedQuote) : []
  const availableCrops = useMemo(() => marketService.availableCrops(), [])

  useEffect(() => {
    let cancelled = false
    marketService
      .listQuotes(userCrops, marketRegion, activeState)
      .then((nextQuotes) => {
        if (!cancelled) setQuotes(nextQuotes)
      })
      .catch(() => {
        if (!cancelled) setQuotes([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [activeState, marketRegion, userCrops])

  const selectCrop = (crop: string, tab: MarketDetailTab = 'summary') => {
    setSelectedCrop(crop)
    setDetailTab(tab)
    setSearchParams({ cultura: crop })
  }

  const refreshQuotes = () => {
    setLoading(true)
    marketService
      .listQuotes(userCrops, marketRegion, activeState)
      .then(setQuotes)
      .catch(() => setQuotes([]))
      .finally(() => setLoading(false))
  }

  const addCrop = async () => {
    setLoading(true)
    try {
      const nextQuotes = await marketService.addQuote(newCrop, marketRegion, activeState, userCrops)
      setQuotes(nextQuotes)
      setActiveFilter('all')
      selectCrop(newCrop)
    } finally {
      setLoading(false)
    }
  }

  const openSource = (sourceUrl?: string) => {
    if (!sourceUrl) return
    const popup = window.open(sourceUrl, '_blank', 'noopener,noreferrer')
    if (popup) popup.opener = null
  }

  return {
    activeFilter,
    activeState,
    advancedCards,
    availableCrops,
    chartHasRealSeries,
    chartPeriod,
    climateRows,
    compareMode,
    comparisonQuotes,
    detailTab,
    fields,
    filteredQuotes,
    loading,
    marketRegion,
    newCrop,
    openSource,
    quickInsights,
    quotes,
    refreshQuotes,
    addCrop,
    selectCrop,
    selectedChartPoints,
    selectedQuote,
    setActiveFilter,
    setChartPeriod,
    setCompareMode,
    setDetailTab,
    setNewCrop,
    setShowClimateImpact,
    showClimateImpact,
    sourceCards,
    todayQuotes,
    userCrops,
  }
}

export type MarketPageState = ReturnType<typeof useMarketPage>
