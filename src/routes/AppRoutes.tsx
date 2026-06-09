import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { AccountPage } from '../pages/AccountPage'
import { AlertsPage } from '../pages/AlertsPage'
import { DashboardPage } from '../pages/DashboardPage'
import { FeedbackPage } from '../pages/FeedbackPage'
import { FieldDetailPage } from '../pages/FieldDetailPage'
import { FieldsPage } from '../pages/FieldsPage'
import { LandingPage } from '../pages/LandingPage'
import { LoginPage } from '../pages/LoginPage'
import { RadarPage } from '../pages/RadarPage'
import { MarketPage } from '../pages/MarketPage'
import { NewFarmPage } from '../pages/NewFarmPage'
import { NewFieldPage } from '../pages/NewFieldPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { OnboardingPage } from '../pages/OnboardingPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<LandingPage />} path="/" />
      <Route element={<LoginPage />} path="/login" />
      <Route element={<OnboardingPage />} path="/onboarding" />
      <Route element={<NewFarmPage />} path="/fazenda/nova" />
      <Route element={<AppShell />}>
        <Route element={<Navigate replace to="/dashboard" />} path="/app" />
        <Route element={<DashboardPage />} path="/dashboard" />
        <Route element={<FieldsPage />} path="/talhoes" />
        <Route element={<NewFieldPage />} path="/talhoes/novo" />
        <Route element={<FieldDetailPage />} path="/talhoes/:fieldId" />
        <Route element={<AlertsPage />} path="/alertas" />
        <Route element={<RadarPage />} path="/mapa" />
        <Route element={<MarketPage />} path="/mercado" />
        <Route element={<FeedbackPage />} path="/feedback" />
        <Route element={<AccountPage />} path="/conta" />
      </Route>
      <Route element={<NotFoundPage />} path="*" />
    </Routes>
  )
}
