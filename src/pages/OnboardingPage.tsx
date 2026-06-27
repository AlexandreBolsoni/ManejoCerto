import { ArrowRight, Bell, CheckCircle2, CloudRain, LineChart, LocateFixed, MapPinned, Radar, ShieldCheck, Sprout } from 'lucide-react'
import '../../public/assets/logo-nome.png'
import { LinkButton } from '../components/ui'
import { NimboFooter } from '../components/footer/NimboFooter'


const items = [
  {
    Icon: Sprout,
    title: 'Decisões por área',
    text: 'Recomendações focadas na sua cultura e estágio fenológico.',
  },
  {
    Icon: Radar,
    title: 'Radar + Previsão',
    text: 'Cruzamento de dados com nível de confiança claro.',
  },
  {
    Icon: Bell,
    title: 'Alertas precisos',
    text: 'Avisos de geada, ventos e chuvas na sua localidade.',
  },
  {
    Icon: LineChart,
    title: 'Mercado atualizado',
    text: 'Cotações oficiais separadas da sua watchlist.',
  },
]

const setupSteps = [
  {
    label: '1',
    title: 'Cadastre a fazenda',
    text: 'Informe a localidade capixaba para ativar os dados da região.',
  },
  {
    label: '2',
    title: 'Ajuste o pin',
    text: 'Arraste o marcador no mapa para a sede ou lavoura.',
  },
  {
    label: '3',
    title: 'Crie suas áreas',
    text: 'Defina a cultura de cada talhão para receber recomendações.',
  },
]

export function OnboardingPage() {
  return (
    <main className="onboarding-page">
      <section className="onboarding-card">
        <header className="onboarding-header">
          <div className="onboarding-header-logo">
            <img src="/assets/logo-nome.png" alt="Nimbo" className="logo" />
          </div>
          <span className="onboarding-badge">Configuração inicial</span>
        </header>

        <div className="onboarding-grid">
          <div className="onboarding-copy">
            <h1>Configure sua propriedade</h1>
            <p className="onboarding-subtitle">
              Transformamos previsões e observações locais em decisões precisas para o seu cultivo. 
              Comece definindo sua localização.
            </p>

            <div className="onboarding-actions">
              <LinkButton to="/fazenda/nova" className="btn-primary">
                Começar agora <ArrowRight size={18} aria-hidden="true" />
              </LinkButton>
              <LinkButton to="/login" variant="secondary" className="btn-secondary">
                Já tenho conta
              </LinkButton>
            </div>

            <div className="onboarding-steps">
              {setupSteps.map((step) => (
                <article key={step.label} className="step-item">
                  <span className="step-number">{step.label}</span>
                  <div className="step-content">
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="location-panel">
            <div className="location-icon-wrapper">
              <MapPinned size={28} aria-hidden="true" />
            </div>
            <h2>Localização sem complicação</h2>
            <p>
              Usamos o município para centralizar o mapa. Depois, você refina a posição exata de forma simples.
            </p>
            
            <div className="onboarding-map-preview" aria-hidden="true">
              <div className="map-preview-bg"></div>
              <span className="map-preview-pin">
                <LocateFixed size={20} />
              </span>
            </div>
            
            <div className="location-panel-note">
              <ShieldCheck size={18} aria-hidden="true" />
              <span>Sem rastreamento contínuo: salvamos apenas o ponto da lavoura.</span>
            </div>
          </aside>
        </div>

        <div className="onboarding-divider"></div>

        <div className="onboarding-items">
          {items.map(({ Icon, text, title }) => (
            <article key={title} className="feature-item">
              <div className="feature-icon">
                <Icon size={22} aria-hidden="true" />
              </div>
              <div className="feature-content">
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>

        <footer className="onboarding-footer">
          <span className="footer-note">
            <CheckCircle2 size={16} aria-hidden="true" />
            Feedback local refina a previsão
          </span>
          <span className="footer-note">
            <CloudRain size={16} aria-hidden="true" />
            Dados salvos funcionam offline
          </span>
        </footer>
      </section>
      
      <div className="onboarding-global-footer">
        <NimboFooter variant="public" />
      </div>
    </main>
  )
}