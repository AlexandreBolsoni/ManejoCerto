import { ArrowRight, Bell, CheckCircle2, CloudRain, LineChart, LocateFixed, MapPinned, Radar, ShieldCheck, Sprout } from 'lucide-react'
import { FullLogo } from '../components/Brand'
import { LinkButton } from '../components/ui'
import { NimboFooter } from '../components/footer/NimboFooter'

const items = [
  {
    Icon: Sprout,
    title: 'Decisões por área',
    text: 'Recomendações específicas para cada cultura e estágio fenológico.',
  },
  {
    Icon: Radar,
    title: 'Radar + previsão + estação',
    text: 'Fontes cruzadas com nível de confiança visível e justificativa simples.',
  },
  {
    Icon: Bell,
    title: 'Alertas que importam',
    text: 'Geada, vento, chuva severa e baixa umidade agrupados por área.',
  },
  {
    Icon: LineChart,
    title: 'Mercado por cultura',
    text: 'Cotações oficiais ou ausência de fonte mostradas sem mistura de preço ao produtor e atacado.',
  },
]

const setupSteps = [
  {
    label: '1',
    title: 'Cadastre a fazenda',
    text: 'Informe a localidade capixaba e uma posição aproximada para ativar os dados regionais.',
  },
  {
    label: '2',
    title: 'Ajuste o pin',
    text: 'O mapa centraliza a cidade e você arrasta o pin para perto da sede, lavoura ou ponto de interesse.',
  },
  {
    label: '3',
    title: 'Crie suas áreas',
    text: 'Cada área recebe cultura, estágio e sensibilidade climática para recomendações melhores.',
  },
  {
    label: '4',
    title: 'Acompanhe suas culturas',
    text: 'O Mercado prioriza culturas dos talhões e mantém a visão geral separada da sua watchlist.',
  },
]

export function OnboardingPage() {
  return (
    <main className="onboarding-page onboarding-page-with-footer">
      <section className="onboarding-card">
        <header className="onboarding-header">
          <FullLogo className="onboarding-logo" />
          <span>Configuração inicial</span>
        </header>

        <div className="onboarding-grid">
          <div className="onboarding-copy">
            <h1>Configure sua fazenda </h1>
            <p>
              transformamos previsões, radares e observações locais em decisões por área de cultivo. Para isso,
              começamos pela cidade, município, distrito, vila ou povoado e pelo ponto aproximado no mapa.
            </p>

            <div className="onboarding-actions">
              <LinkButton to="/fazenda/nova">
                Começar pela fazenda <ArrowRight size={17} aria-hidden="true" />
              </LinkButton>
              <LinkButton to="/login" variant="secondary">
                Já tenho conta
              </LinkButton>
            </div>

            <div className="onboarding-steps" aria-label="Etapas de configuração">
              {setupSteps.map((step) => (
                <article key={step.label}>
                  <strong>{step.label}</strong>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="location-panel">
            <div className="location-panel-icon">
              <MapPinned size={30} aria-hidden="true" />
            </div>
            <div>
              <h2>Localização sem complicação</h2>
              <p>
                Primeiro usamos a localidade no Espírito Santo para centralizar o mapa. Depois o produtor arrasta o pin para
                refinar a posição quando estiver pronto.
              </p>
            </div>
            <div className="onboarding-map-preview" aria-hidden="true">
              <span className="map-preview-pin">
                <LocateFixed size={18} />
              </span>
              <i />
              <i />
              <i />
            </div>
            <div className="location-panel-note">
              <ShieldCheck size={17} aria-hidden="true" />
              <span>Sem rastreamento contínuo: o ponto salvo serve para clima, radar e recomendações.</span>
            </div>
          </aside>
        </div>

        <div className="onboarding-items">
          {items.map(({ Icon, text, title }) => (
            <article key={title}>
              <Icon size={20} aria-hidden="true" />
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>

        <footer className="onboarding-footer">
          <small>
            <CheckCircle2 size={15} aria-hidden="true" />
            Feedback local melhora a previsão da sua fazenda
          </small>
          <small>
            <CloudRain size={15} aria-hidden="true" />
            Últimos dados salvos continuam disponíveis offline
          </small>
        </footer>
      </section>
      <NimboFooter variant="public" />
    </main>
  )
}
