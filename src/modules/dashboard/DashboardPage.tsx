import { RadarAtmosphereCard } from '../../components/radar/QuickWeatherData'
import { OfflineBanner, SkeletonGrid } from '../../components/ui'
import { AlertsPreview } from './components/AlertsPreview'
import { DashboardHeader } from './components/DashboardHeader'
import { DashboardOnboardingState } from './components/DashboardOnboardingState'
import { DaySummary } from './components/DaySummary'
import { Et0Card } from './components/Et0Card'
import { FieldsSummary } from './components/FieldsSummary'
import { IrrigationWindowCard } from './components/IrrigationWindowCard'
import { MarketPreview } from './components/MarketPreview'
import { RadarPreview } from './components/RadarPreview'
import { RainForecast } from './components/RainForecast'
import { useDashboardData } from './hooks/useDashboardData'

export function DashboardPage() {
  const dashboard = useDashboardData()
  const weather = dashboard.weather

  return (
    <section className="dashboard-page">
      <OfflineBanner staleData={dashboard.staleData} />
      {!dashboard.farm ? (
        <DashboardOnboardingState
          locationError={dashboard.locationError}
          locationStatus={dashboard.locationStatus}
          onRequestLocation={() => void dashboard.requestUserLocation()}
          userLocation={dashboard.userLocation}
        />
      ) : (
        <>
          <DashboardHeader
            crop={weather.crop}
            fieldName={weather.fieldName}
            firstName={dashboard.firstName}
            headerLocation={dashboard.headerLocation}
            locationStatus={dashboard.locationStatus}
            onRefresh={() => void dashboard.refreshClimate()}
            onRequestLocation={() => void dashboard.requestUserLocation()}
            userLocation={dashboard.userLocation}
          />
          {dashboard.locationError ? <p className="inline-warning">{dashboard.locationError}</p> : null}

          {dashboard.weatherLoading && !dashboard.climate ? (
            <SkeletonGrid />
          ) : (
            <div className="dashboard-grid">
              {dashboard.dashboardRadarData ? <RadarAtmosphereCard className="dashboard-atmosphere-card" data={dashboard.dashboardRadarData} statusLevel="stable" /> : null}
              <IrrigationWindowCard irrigationWindow={weather.irrigationWindow} />
              <Et0Card et0={weather.et0} />
              <MarketPreview featuredMarket={dashboard.featuredMarket} marketPreview={dashboard.marketPreview} />
              <AlertsPreview alerts={dashboard.alerts} />
              <RadarPreview radarStatus={dashboard.dashboard.sourceStatus.radar} userLocation={dashboard.userLocation} />
              <DaySummary et0Description={weather.et0.description} recommendation={dashboard.recommendation} sources={weather.sources} />
              <RainForecast forecastHours={dashboard.forecastPreview} />
              <FieldsSummary fields={dashboard.fields} highRiskFields={dashboard.highRiskFields} visibleFields={dashboard.visibleFields} />
            </div>
          )}
        </>
      )}
    </section>
  )
}
