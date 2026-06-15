import { Database, LocateFixed, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { APP_NAME, APP_SLOGAN, APP_STATE, APP_VERSION } from '../../config/brand'
import { footerLinkSections, publicFooterLinks } from '../../config/footerLinks'
import { useAuth } from '../../hooks/useAuth'
import { useCurrentFarm } from '../../hooks/useCurrentFarm'
import { useFields } from '../../hooks/useFields'
import { useWeather } from '../../hooks/useWeather'
import { Brand } from '../Brand'
import { LinkButton } from '../ui'

export type FooterVariant = 'full' | 'public' | 'minimal'

const dataSources = ['Open-Meteo', 'INMET', 'RainViewer', 'IBGE', 'NASA GIBS']

export function NimboFooter({ variant = 'full' }: { variant?: FooterVariant }) {
  const { farm } = useCurrentFarm()
  const { fields } = useFields()
  const { locationStatus, weatherLocation } = useWeather()
  const { user } = useAuth()
  const locationLabel = resolveLocationLabel({
    farmLocation: farm?.locationLabel,
    farmName: farm?.name,
    fieldCount: fields.length,
    locationStatus,
    weatherLocationLabel: weatherLocation?.label,
  })

  if (variant === 'minimal') {
    return (
      <footer className="nimbo-footer minimal">
        <div>
          <Brand compact to="/" />
          <span>Versão {APP_VERSION}</span>
        </div>
        <nav aria-label="Links legais mínimos">
          {publicFooterLinks.slice(0, 3).map((link) => (
            <Link key={link.path} to={link.path}>
              {link.label}
            </Link>
          ))}
        </nav>
      </footer>
    )
  }

  if (variant === 'public') {
    return (
      <footer className="nimbo-footer public">
        <div className="nimbo-footer-brand">
          <Brand compact to="/" />
          <p>{APP_SLOGAN}</p>
        </div>
        <nav aria-label="Links legais públicos">
          {publicFooterLinks.map((link) => (
            <Link key={link.path} to={link.path}>
              {link.label}
            </Link>
          ))}
        </nav>
        <small>
          Versão {APP_VERSION} · © 2026 {APP_NAME}
        </small>
      </footer>
    )
  }

  return (
    <footer className="nimbo-footer full">
      <section className="nimbo-footer-top">
        <div className="nimbo-footer-brand">
          <Brand compact to="/dashboard" />
          <p>{APP_SLOGAN}</p>
        </div>
        <div className="footer-trust-card">
          <ShieldCheck size={18} aria-hidden="true" />
          <div>
            <strong>Transparência e controle</strong>
            <span>{user?.email ? `Conta conectada: ${user.email}` : 'Acesse sua conta para controlar seus dados.'}</span>
          </div>
        </div>
      </section>

      <section className="footer-location-card" aria-label="Localização usada pelo app">
        <LocateFixed size={18} aria-hidden="true" />
        <div>
          <strong>Localização usada</strong>
          <span>{locationLabel}</span>
        </div>
        <LinkButton size="sm" to="/permissions" variant="secondary">
          Alterar localização
        </LinkButton>
      </section>

      <section className="nimbo-footer-grid" aria-label="Links do rodapé">
        {footerLinkSections.map((section) => (
          <details className="footer-section" key={section.title} open>
            <summary>{section.title}</summary>
            <nav aria-label={section.title}>
              {section.links.map((link) => (
                <Link key={`${section.title}-${link.label}-${link.path}`} to={link.path}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </details>
        ))}
      </section>

      <section className="footer-data-strip" aria-label="Fontes resumidas">
        <Database size={17} aria-hidden="true" />
        <span>Dados usados:</span>
        <strong>{dataSources.join(', ')}</strong>
      </section>

      <div className="nimbo-footer-bottom">
        <span>Versão {APP_VERSION}</span>
        <span>© 2026 {APP_NAME}</span>
      </div>
    </footer>
  )
}

function resolveLocationLabel({
  farmLocation,
  farmName,
  fieldCount,
  locationStatus,
  weatherLocationLabel,
}: {
  farmLocation?: string
  farmName?: string
  fieldCount: number
  locationStatus: string
  weatherLocationLabel?: string
}) {
  if (farmLocation) return `${farmLocation}${farmName ? ` · ${farmName}` : ''}${fieldCount ? ` · ${fieldCount} áreas` : ''}`
  if (weatherLocationLabel) return weatherLocationLabel
  if (locationStatus === 'denied') return 'Localização bloqueada no navegador'
  if (locationStatus === 'requesting') return 'Buscando localização atual'
  return `Localização não definida · ${APP_STATE}`
}
