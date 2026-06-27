import { type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { AppShell } from '../components/AppShell'
import { AccountPage } from '../pages/AccountPage'
import { AlertsPage } from '../pages/AlertsPage'
import { DashboardPage } from '../pages/DashboardPage'
import { FeedbackPage } from '../pages/FeedbackPage'
import { FieldDetailPage } from '../pages/FieldDetailPage'
import { FieldsPage } from '../pages/FieldsPage'
import { FooterInfoPage } from '../pages/FooterInfoPage'
import { LandingPage } from '../pages/LandingPage'
import { LoginPage } from '../pages/LoginPage'
import { MarketPage } from '../pages/MarketPage'
import { NewFarmPage } from '../pages/NewFarmPage'
import { NewFieldPage } from '../pages/NewFieldPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { OnboardingPage } from '../pages/OnboardingPage'
import { RadarPage } from '../pages/RadarPage'

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return null
  }

  if (!user) {
    return <Navigate replace to="/login" />
  }

  return <>{children}</>
}

export function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route element={user ? <Navigate replace to="/dashboard" /> : <LandingPage />} path="/" />
      <Route element={user ? <Navigate replace to="/dashboard" /> : <LoginPage />} path="/login" />
      <Route element={<RequireAuth><OnboardingPage /></RequireAuth>} path="/onboarding" />
      <Route element={<RequireAuth><NewFarmPage /></RequireAuth>} path="/fazenda/nova" />
      <Route element={<RequireAuth><AppShell /></RequireAuth>}>
        <Route element={<Navigate replace to="dashboard" />} path="app" />
        <Route element={<Navigate replace to="dashboard" />} path="home" />
        <Route element={<Navigate replace to="conta" />} path="account" />
        <Route element={<Navigate replace to="conta" />} path="profile" />
        <Route element={<Navigate replace to="mapa" />} path="radar" />
        <Route element={<Navigate replace to="alertas" />} path="alerts" />
        <Route element={<Navigate replace to="mercado" />} path="market" />
        <Route element={<DashboardPage />} path="dashboard" />
        <Route element={<FieldsPage />} path="talhoes" />
        <Route element={<NewFieldPage />} path="talhoes/novo" />
        <Route element={<FieldDetailPage />} path="talhoes/:fieldId" />
        <Route element={<AlertsPage />} path="alertas" />
        <Route element={<RadarPage />} path="mapa" />
        <Route element={<MarketPage />} path="mercado" />
        <Route element={<FeedbackPage />} path="feedback" />
        <Route element={<AccountPage />} path="conta" />
      </Route>
      <Route element={<FooterInfoPage page="privacy" />} path="/privacy" />
      <Route element={<FooterInfoPage page="cookies" />} path="/cookies" />
      <Route element={<FooterInfoPage page="permissions" />} path="/permissions" />
      <Route element={<FooterInfoPage page="consents" />} path="/consents" />
      <Route element={<FooterInfoPage page="dataSources" />} path="/data-sources" />
      <Route element={<FooterInfoPage page="alertsMethodology" />} path="/alerts-methodology" />
      <Route element={<FooterInfoPage page="apiStatus" />} path="/api-status" />
      <Route element={<FooterInfoPage page="forecastLimitations" />} path="/forecast-limitations" />
      <Route element={<FooterInfoPage page="farms" />} path="/farms" />
      <Route element={<FooterInfoPage page="crops" />} path="/crops" />
      <Route element={<FooterInfoPage page="alertPreferences" />} path="/alert-preferences" />
      <Route element={<FooterInfoPage page="help" />} path="/help" />
      <Route element={<FooterInfoPage page="reportProblem" />} path="/report-problem" />
      <Route element={<FooterInfoPage page="contact" />} path="/contact" />
      <Route element={<FooterInfoPage page="about" />} path="/about" />
      <Route element={<FooterInfoPage page="terms" />} path="/terms" />
      <Route element={<FooterInfoPage page="deleteAccount" />} path="/delete-account" />
      <Route element={<NotFoundPage />} path="*" />
    </Routes>
  )
}
