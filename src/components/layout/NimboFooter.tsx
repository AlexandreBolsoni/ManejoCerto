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
import '../../../public/assets/logo-nome.png' // Mantido conforme seu original

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

  // ==========================================================================
  // VARIANTE: MINIMAL (Usada em fluxos de onboarding ou telas isoladas)
  // ==========================================================================
  if (variant === 'minimal') {
    return (
      <footer className="nimbo-footer minimal">
        <div className="footer-minimal-brand">
          <Brand compact to="/" />
          <span className="footer-version">Versão {APP_VERSION}</span>
        </div>
        <nav aria-label="Links legais mínimos" className="footer-minimal-nav">
          {publicFooterLinks.slice(0, 3).map((link) => (
            <Link key={link.path} to={link.path}>
              {link.label}
            </Link>
          ))}
        </nav>
      </footer>
    )
  }

  // ==========================================================================
  // VARIANTE: PUBLIC (Usada na Landing Page e páginas de info)
  // ==========================================================================
  if (variant === 'public') {
    return (
      <footer className="nimbo-footer public">
        <div className="footer-public-brand">
          <img src="/assets/logo-nome.png" alt={APP_NAME} />
          <p>{APP_SLOGAN}</p>
        </div>
        <nav aria-label="Links legais públicos" className="footer-public-nav">
          {publicFooterLinks.map((link) => (
            <Link key={link.path} to={link.path}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="footer-public-copy">
          <small>Versão {APP_VERSION}</small>
          <small>·</small>
          <small>© 2026 {APP_NAME}</small>
        </div>
      </footer>
    )
  }

  // ==========================================================================
  // VARIANTE: FULL (Usada dentro do App Shell / Painel Logado)
  // ==========================================================================
  return (
    <footer className="nimbo-footer full">
      
      {/* Topo do Footer: Marca e Trust Card */}
      <section className="footer-top">
        <div className="footer-brand-col">
          <Brand compact to="/dashboard" />
          <p>{APP_SLOGAN}</p>
        </div>
        
        <div className="footer-info-cards">
          <div className="footer-card trust-card">
            <ShieldCheck size={18} aria-hidden="true" className="icon-green" />
            <div className="footer-card-text">
              <strong>Transparência e controle</strong>
              <span>{user?.email ? `Conta conectada: ${user.email}` : 'Acesse sua conta para controlar seus dados.'}</span>
            </div>
          </div>

          <div className="footer-card location-card" aria-label="Localização usada pelo app">
            <LocateFixed size={18} aria-hidden="true" className="icon-green" />
            <div className="footer-card-text">
              <strong>Localização usada</strong>
              <span>{locationLabel}</span>
            </div>
            <LinkButton size="sm" to="/permissions" variant="secondary" className="location-btn">
              Alterar
            </LinkButton>
          </div>
        </div>
      </section>

      {/* Grid de Navegação Principal */}
      <section className="footer-nav-grid" aria-label="Links do rodapé">
        {footerLinkSections.map((section) => (
          <div className="footer-nav-group" key={section.title}>
            <h4>{section.title}</h4>
            <nav aria-label={section.title}>
              {section.links.map((link) => (
                <Link key={`${section.title}-${link.label}-${link.path}`} to={link.path}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        ))}
      </section>

      {/* Faixa de Fontes de Dados e Copyright */}
      <section className="footer-bottom">
        <div className="footer-data-strip" aria-label="Fontes resumidas">
          <Database size={16} aria-hidden="true" />
          <span>Dados processados via:</span>
          <strong>{dataSources.join(', ')}</strong>
        </div>

        <div className="footer-copyright">
          <span>Versão {APP_VERSION}</span>
          <span>© 2026 {APP_NAME}</span>
        </div>
      </section>
    </footer>
  )
}

// Lógica isolada mantida exatamente como a sua
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