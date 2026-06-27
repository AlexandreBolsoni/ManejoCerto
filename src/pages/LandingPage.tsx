import { ArrowRight, Bell, CheckCircle2, CloudRain, Crosshair, Droplets, Gauge, Leaf, Map, Sprout, Wifi } from 'lucide-react'
import { Badge } from '../components/ui'
import { LinkButton } from '../components/ui'
import { NimboFooter } from '../components/footer/NimboFooter'
import { PublicHeader } from '../components/PublicHeader'

const features = [
  {
    Icon: Droplets,
    title: 'Janela ideal de irrigação',
    text: 'Cruza ET₀ FAO-56, chuva prevista e estágio fenológico para indicar quando regar — e quando esperar.',
  },
  {
    Icon: Sprout,
    title: 'Aplicação de defensivos',
    text: 'Identifica janelas com vento, umidade e chuva nos limites recomendados por cultura.',
  },
  {
    Icon: Map,
    title: 'Radar e nowcast',
    text: 'Camada RainViewer com scrubber temporal. Volte para agora com um toque.',
  },
  {
    Icon: Bell,
    title: 'Alertas locais',
    text: 'Geada, vento forte e chuva severa — agrupados por área, com nível de severidade.',
  },
  {
    Icon: Gauge,
    title: 'Mercado por cultura',
    text: 'Cotações e referências agrícolas priorizadas para o Espírito Santo.',
  },
  {
    Icon: Wifi,
    title: 'Funciona offline',
    text: 'PWA com cache inteligente. Feedbacks vão para fila e sincronizam automaticamente.',
  },
]

export function LandingPage() {
  return (
    <div className="landing-page">
      <PublicHeader />
      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <Badge tone="green">• Funciona offline no campo</Badge>
            <h1>Inteligência climática para proteger sua safra</h1>
            <p>
              Traduzimos dados de previsão em decisões práticas para propriedades capixabas. Responder oque realmente importa:
              <em> irrigar agora ou adiar?
              <br /> qual a melhor janela para aplicar defensivos?</em>
            </p>
            <div className="hero-actions">
              <LinkButton size="lg" to="/onboarding">
                Criar minha fazenda <ArrowRight size={18} aria-hidden="true" />
              </LinkButton>
              <a className="btn secondary lg" href="#motor">
                Como funciona o motor
              </a>
            </div>
            <div className="hero-stats">
              <strong>3+</strong>
              <span>fontes cruzadas</span>
              <strong>FAO-56</strong>
              <span>padrão ET₀</span>
              <strong>24h</strong>
              <span>nowcast</span>
            </div>
          </div>

          <div className="hero-visual">
            <img src="/assets/hero-fields.jpg" alt="Lavoura ao entardecer com nuvens" />
            <div className="hero-chip radar">
              <Crosshair size={16} aria-hidden="true" />
              Radar ativo · ES
            </div>
            <div className="hero-chip frost">
              <Bell size={16} aria-hidden="true" />
              Alerta de geada
            </div>
            <div className="hero-decision-card">
              <div className="decision-icon">
                <Droplets size={24} aria-hidden="true" />
              </div>
              <div>
                <span>TALHÃO NORTE · SOJA</span>
                <h2>Adiar irrigação para amanhã</h2>
                <p>Chuva de 8–14 mm prevista nas próximas 6h · ET₀ 3.2 mm</p>
                <div className="decision-badges">
                  <Badge tone="green">Confiança 92%</Badge>
                  <Badge tone="soft">3 fontes ✓</Badge>
                </div>
              </div>
              <small>há 4 min</small>
            </div>
          </div>
        </section>

        <section className="source-strip" aria-label="Dados de alta confiança">
          <span>DADOS DE ALTA CONFIANÇA</span>
          <strong>Open-Meteo <small>previsão global</small></strong>
          <strong>RainViewer <small>radar em tempo real</small></strong>
          <strong>INMET <small>estações oficiais BR</small></strong>
          <strong>FAO-56 <small>padrão ET₀</small></strong>
        </section>

        <section className="landing-band" id="recursos">
          <div className="section-intro">
            <span>O que o Manejo Certo entrega</span>
            <h2>Decisões operacionais, não números soltos</h2>
            <p>Cada card responde a uma pergunta da rotina no campo, com justificativa textual simples e nível de confiança.</p>
          </div>
          <div className="feature-grid">
            {features.map(({ Icon, text, title }) => (
              <article className="feature-card" key={title}>
                <Icon size={22} aria-hidden="true" />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="decision-engine-band" id="motor">
          <div>
            <Badge tone="soft">WCAG 2.2 AA · contraste 4.5:1 garantido</Badge>
            <h2>Do dado bruto à ação explicável</h2>
            <p>
              Em vez de tabelas de meteorologia, o Manejo Certo entrega uma recomendação por área — com o porquê,
              a confiança e as fontes que sustentam a decisão.
            </p>
          </div>
          <div className="engine-steps">
            {['Coleta multi-fonte', 'Normalização e ET₀', 'Score + justificativa', 'Ajuste local'].map((step, index) => (
              <article key={step}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{step}</h3>
                <p>
                  {index === 0 && 'Open-Meteo, RainViewer e INMET — com cache para custo previsível.'}
                  {index === 1 && 'Evapotranspiração de referência pelo método FAO-56 Penman-Monteith.'}
                  {index === 2 && 'Motor próprio gera indicador numérico e texto explicável para o produtor.'}
                  {index === 3 && 'Feedbacks pós-chuva calibram o modelo para sua fazenda.'}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="feedback-band" id="feedback">
          <div className="feedback-demo-card">
            <CloudRain size={26} aria-hidden="true" />
            <h2>Choveu na sua lavoura agora?</h2>
            <p>Detectamos chuva na área principal às 14:32.</p>
            <div>
              <button type="button">Sim, choveu</button>
              <button type="button">Não choveu</button>
            </div>
            <label>
              Volume no pluviômetro (mm)
              <strong>12mm</strong>
            </label>
            <small>Sem rede? Salvamos e sincronizamos depois.</small>
          </div>
          <div>
            <span>Calibração com humano no loop</span>
            <h2>Sua observação melhora a previsão da sua fazenda</h2>
            <p>
              A cada confirmação ou correção, o Manejo Certo limpa falsos positivos de radares e satélites e refina
              o modelo localmente — para o seu solo, sua microrregião e sua cultura.
            </p>
            <ul>
              {['Pergunta binária rápida, sem fricção', 'Campo opcional de mm para quem tem pluviômetro', 'Fila offline com sincronização automática', 'Histórico por área com divergências marcadas'].map((item) => (
                <li key={item}>
                  <CheckCircle2 size={17} aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="landing-cta">
          <Leaf size={26} aria-hidden="true" />
          <h2>Comece com sua primeira fazenda em menos de 2 minutos</h2>
          <p>Cadastre uma área, cultura e pronto — você passa a receber recomendações do dia ainda hoje.</p>
          <div>
            <br />
            <LinkButton to="/onboarding">Criar minha conta</LinkButton>
           
          </div>
        </section>
      </main>
      <NimboFooter variant="public" />
    </div>
  )
}
