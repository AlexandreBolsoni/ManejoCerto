import { CloudOff } from 'lucide-react'
import { useState } from 'react'
import { RadarEmptyState } from '../../components/radar/RadarEmptyState'
import { RadarHeader } from '../../components/radar/RadarHeader'
import { Button, LinkButton } from '../../components/ui'
import { APP_STATE_NAME } from '../../config/brand'
import { useCurrentFarm } from '../../hooks/useCurrentFarm'
import { useFields } from '../../hooks/useFields'
import { useRadarWeather } from '../../hooks/useRadarWeather'
import { useWeather } from '../../hooks/useWeather'
import type { ForecastHour } from '../../types'
import {
  ActiveLayersCard,
  DecisionSummaryCard,
  LocalAlertsCard,
  NowCard,
  OperationalWindowCard,
  QuickReadingCard,
  SixHourForecastCard,
} from './components/RadarDecisionCards'
import { RadarMapPanel } from './components/RadarMapPanel'
import { RadarSceneControl } from './components/RadarSceneControl'
import type { RadarMapLayer, RadarSceneMode } from './types/radar.types'

export function RadarPage() {
  const { farm } = useCurrentFarm()
  const { activeFieldId, fields, setActiveFieldId } = useFields()
  const { climate, weatherLocation } = useWeather()
  const { data, error, isCached, isOnline, loading, refresh, visualLoading } = useRadarWeather()
  const [mode, setMode] = useState<RadarSceneMode>('local')
  const [activeLayer, setActiveLayer] = useState<RadarMapLayer>('rain')
  const [activeHour, setActiveHour] = useState(3)

  const safeHours = buildSafeHours({
    currentData: data,
    fallbackBaseTime: data?.updatedAt ?? climate?.weather.forecastHours?.[0]?.time ?? '1970-01-01T00:00:00.000Z',
    hours: climate?.weather.forecastHours?.slice(0, 7) ?? [],
  })
  const selectedHour = Math.min(activeHour, safeHours.length - 1)
  const regionLabel = data?.farm.state && data.farm.state.length > 2 ? data.farm.state : APP_STATE_NAME

  return (
    <section className="radar2-page radar-climate-page">
      <RadarHeader
        activeFieldId={activeFieldId}
        data={data}
        fields={fields}
        loading={loading || visualLoading}
        onFieldChange={setActiveFieldId}
        onRefresh={() => void refresh()}
      />

      {!farm || !weatherLocation ? (
        <RadarEmptyState action={<LinkButton to="/fazenda/nova">Cadastrar localização</LinkButton>} kind="no-location" />
      ) : loading ? (
        <RadarEmptyState kind="loading" />
      ) : data ? (
        <>
          {isCached || !isOnline ? (
            <div className="radar2-data-notice">
              <CloudOff size={17} aria-hidden="true" />
              <span><strong>Exibindo a última leitura salva.</strong> Atualizaremos assim que houver conexão.</span>
            </div>
          ) : error ? (
            <div className="radar2-data-notice warning">
              <CloudOff size={17} aria-hidden="true" />
              <span><strong>Algumas camadas não atualizaram.</strong> A leitura da fazenda continua disponível.</span>
            </div>
          ) : null}

          <RadarSceneControl activeMode={mode} onChange={setMode} />

          <div className="radar-climate-layout">
            <RadarMapPanel
              activeHour={selectedHour}
              activeLayer={activeLayer}
              data={data}
              hours={safeHours.slice(0, 5)}
              loading={visualLoading}
              mode={mode}
              onHourChange={setActiveHour}
              onLayerChange={setActiveLayer}
              regionLabel={regionLabel}
            />
            <aside className="radar-climate-side">
              <NowCard data={data} />
              <QuickReadingCard data={data} />
              <ActiveLayersCard activeLayer={activeLayer} mode={mode} onLayerChange={setActiveLayer} onModeChange={setMode} />
              <OperationalWindowCard data={data} />
            </aside>
            <SixHourForecastCard hours={safeHours.slice(0, 7)} />
            <LocalAlertsCard data={data} />
            <DecisionSummaryCard data={data} />
          </div>
        </>
      ) : (
        <RadarEmptyState action={<Button onClick={() => void refresh()}>Tentar novamente</Button>} kind={isOnline ? 'error' : 'offline'} />
      )}
    </section>
  )
}

function buildSafeHours({
  currentData,
  fallbackBaseTime,
  hours,
}: {
  currentData: ReturnType<typeof useRadarWeather>['data']
  fallbackBaseTime: string
  hours: ForecastHour[]
}) {
  if (hours.length > 0) return hours

  const fallbackBaseMs = new Date(fallbackBaseTime).getTime()

  return Array.from({ length: 7 }, (_, index) => ({
    et0Mm: 0,
    gustKmh: currentData?.current.windGust ?? 0,
    humidityPct: currentData?.current.humidity ?? 0,
    precipMm: index === 2 ? currentData?.current.rainNext3h ?? 0 : 0,
    precipProbabilityPct: currentData?.current.rainChance ?? 0,
    temperatureC: currentData?.current.temperature ?? 0,
    time: new Date(fallbackBaseMs + index * 60 * 60 * 1000).toISOString(),
    weatherCode: 1,
    windDirectionDeg: undefined,
    windKmh: currentData?.current.windSpeed ?? 0,
  }))
}
