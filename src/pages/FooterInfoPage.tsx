import { Link } from 'react-router-dom'
import { AlertTriangle, Bell, Cookie, Database, HelpCircle, Info, LockKeyhole, MapPin, ShieldCheck, Sprout, Trash2 } from 'lucide-react'
import { Button, LinkButton } from '../components/ui'
import { Card } from '../components/ui'
import { APP_NAME, APP_VERSION } from '../config/brand'
import { useCurrentFarm } from '../hooks/useCurrentFarm'
import { useFields } from '../hooks/useFields'
import { useUserSettings } from '../hooks/useUserSettings'

type InfoPageKey =
  | 'privacy'
  | 'cookies'
  | 'permissions'
  | 'consents'
  | 'deleteAccount'
  | 'dataSources'
  | 'alertsMethodology'
  | 'apiStatus'
  | 'forecastLimitations'
  | 'farms'
  | 'crops'
  | 'alertPreferences'
  | 'help'
  | 'reportProblem'
  | 'contact'
  | 'about'
  | 'terms'

type InfoPageContent = {
  title: string
  kicker: string
  summary: string
  Icon: typeof ShieldCheck
  actions?: { label: string; path: string; variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }[]
  sections: { title: string; text: string; items?: string[] }[]
}

const infoPages: Record<InfoPageKey, InfoPageContent> = {
  privacy: {
    title: 'Política de Privacidade',
    kicker: 'Privacidade e segurança',
    summary: `${APP_NAME} usa dados mínimos para entregar previsão climática, alertas e recomendações agrícolas.`,
    Icon: ShieldCheck,
    actions: [
      { label: 'Gerenciar consentimentos', path: '/consents' },
      { label: 'Permissões do app', path: '/permissions', variant: 'secondary' },
      { label: 'Excluir minha conta', path: '/delete-account', variant: 'danger' },
    ],
    sections: [
      {
        title: 'Quais dados coletamos',
        text: 'Coletamos dados necessários para conta, fazenda, áreas de cultivo, localização operacional, preferências, alertas e funcionamento técnico do app.',
        items: ['Nome, email e identificador do usuário', 'Nome da fazenda, município, UF e coordenadas aproximadas', 'Culturas cadastradas, estágios e preferências de alerta', 'Previsões consultadas, alertas exibidos e dados de radar'],
      },
      {
        title: 'Por que usamos esses dados',
        text: 'Usamos esses dados para calcular clima, radar, recomendações, janelas de operação, alertas e referências de mercado por região.',
      },
      {
        title: 'Seus direitos',
        text: 'Você pode solicitar acesso, correção, eliminação, portabilidade quando aplicável e revogação de consentimentos opcionais.',
      },
      {
        title: 'Compartilhamento e fontes externas',
        text: 'O app consulta APIs climáticas, mapas, radar e mercado. Dados pessoais não são vendidos e devem ser usados apenas para funcionamento e melhoria do serviço.',
      },
    ],
  },
  cookies: {
    title: 'Cookies e dados locais',
    kicker: 'Controle de dados locais',
    summary: 'Usamos dados locais para manter login, preferências, cache offline e funcionamento estável no campo.',
    Icon: Cookie,
    actions: [
      { label: 'Salvar preferências', path: '/consents' },
      { label: 'Usar somente o necessário', path: '/consents', variant: 'secondary' },
    ],
    sections: [
      {
        title: 'Necessários',
        text: 'Sempre ativos para login, segurança, sessão, cache técnico, funcionamento offline e preferências básicas.',
      },
      {
        title: 'Funcionais',
        text: 'Podem salvar última fazenda acessada, cultura favorita, filtros, cidade usada e preferências visuais.',
      },
      {
        title: 'Análise e melhoria',
        text: 'Ajudam a entender erros, desempenho e telas mais usadas. São opcionais e podem ser revogados.',
      },
      {
        title: 'Marketing',
        text: 'Desativado na versão inicial do app.',
      },
    ],
  },
  permissions: {
    title: 'Permissões do app',
    kicker: 'Localização, notificações e cache',
    summary: 'Veja quais permissões o app usa e como cada uma impacta clima, radar e alertas.',
    Icon: MapPin,
    actions: [
      { label: 'Usar localização atual', path: '/dashboard' },
      { label: 'Escolher alertas', path: '/alert-preferences', variant: 'secondary' },
    ],
    sections: [
      {
        title: 'Localização',
        text: 'Usada para previsão do tempo, radar de chuva, estações próximas, recomendações agrícolas e alertas por região.',
        items: ['Permitida: usa GPS quando solicitado', 'Manual: usa a fazenda/localidade cadastrada', 'Bloqueada: usa apenas dados salvos ou informados manualmente'],
      },
      {
        title: 'Notificações',
        text: 'Usadas para chuva forte, vento intenso, pulverização, temperatura, estiagem e alertas operacionais importantes.',
      },
      {
        title: 'Armazenamento local/cache',
        text: 'Mantém dados recentes disponíveis quando a conexão no campo oscila.',
      },
    ],
  },
  consents: {
    title: 'Gerenciar consentimentos',
    kicker: 'Central de controle',
    summary: 'Controle o que foi aceito, revise versões e revogue permissões opcionais com facilidade.',
    Icon: LockKeyhole,
    actions: [
      { label: 'Salvar alterações', path: '/conta' },
      { label: 'Revogar opcionais', path: '/cookies', variant: 'secondary' },
    ],
    sections: [
      {
        title: 'Política e termos',
        text: `Versão de privacidade, cookies e termos: ${APP_VERSION}. Histórico completo será registrado quando a central de consentimentos estiver conectada ao Firestore.`,
      },
      {
        title: 'Cookies',
        text: 'Necessários ficam ativos. Funcionais e análise podem ser ligados ou revogados pelo usuário.',
      },
      {
        title: 'Localização e notificações',
        text: 'O usuário pode alternar entre localização manual/GPS e escolher quais alertas deseja receber.',
      },
    ],
  },
  deleteAccount: {
    title: 'Excluir minha conta',
    kicker: 'Conta e privacidade',
    summary: 'Entenda o que será removido antes de solicitar exclusão da conta.',
    Icon: Trash2,
    actions: [
      { label: 'Baixar meus dados', path: '/privacy', variant: 'secondary' },
      { label: 'Voltar para conta', path: '/conta' },
    ],
    sections: [
      {
        title: 'O que será removido',
        text: 'Dados de usuário, fazendas cadastradas, áreas, culturas, preferências e consentimentos serão removidos conforme regras aplicáveis.',
      },
      {
        title: 'Antes de excluir',
        text: 'Revise fazendas cadastradas, baixe seus dados quando disponível e cancele alertas ativos.',
      },
      {
        title: 'Dados que podem permanecer',
        text: 'Registros mínimos podem ser mantidos quando necessários por segurança, auditoria ou obrigação legal.',
      },
    ],
  },
  dataSources: {
    title: 'Fontes de dados do NimbuES',
    kicker: 'Dados e fontes',
    summary: 'Combinamos clima, mapas, radar, localização e mercado agrícola para gerar uma visão útil para o produtor.',
    Icon: Database,
    actions: [{ label: 'Ver status das APIs', path: '/api-status' }],
    sections: [
      {
        title: 'Clima e previsão',
        text: 'Open-Meteo, INMET, CPTEC/BrasilAPI e AccuWeather entram como fontes climáticas e comparação de confiança.',
      },
      {
        title: 'Radar e satélite',
        text: 'RainViewer alimenta radar visual de chuva. NASA GIBS pode apoiar imagens diárias de satélite.',
      },
      {
        title: 'Localização e mapas',
        text: 'IBGE Localidades, IBGE Malhas, OpenStreetMap, CARTO Maps, GeoJS, ipwhois.app e Geolocation DB ajudam com geografia, mapa-base e fallback de localização.',
      },
      {
        title: 'Mercado agrícola',
        text: 'Cotação do Café, Redação Agro e referências internas aparecem com qualidade de dado separada para não misturar histórico real com estimativa.',
      },
    ],
  },
  alertsMethodology: {
    title: 'Como calculamos alertas',
    kicker: 'Metodologia',
    summary: 'Alertas combinam previsão, chuva, vento, temperatura, umidade, evapotranspiração, radar e dados da fazenda.',
    Icon: Bell,
    actions: [{ label: 'Preferências de alerta', path: '/alert-preferences' }],
    sections: [
      {
        title: 'Pulverização',
        text: 'Considera vento, chuva prevista, umidade, temperatura e janela de tempo. Se as condições estiverem ruins, o app recomenda evitar ou adiar a aplicação.',
      },
      {
        title: 'Irrigação',
        text: 'Considera chuva recente, previsão de chuva, evapotranspiração e condição climática dos próximos dias.',
      },
      {
        title: 'Chuva forte e radar',
        text: 'Considera previsão horária, acumulado diário e radar quando disponível.',
      },
      {
        title: 'Aviso importante',
        text: 'O app é ferramenta de apoio à decisão e não substitui avaliação técnica do produtor, agrônomo ou responsável pela lavoura.',
      },
    ],
  },
  apiStatus: {
    title: 'Status das APIs',
    kicker: 'Disponibilidade das fontes',
    summary: 'Veja quais fontes estão disponíveis e qual função cada uma exerce no app.',
    Icon: Database,
    sections: [
      {
        title: 'Online',
        text: 'Open-Meteo, RainViewer, IBGE Localidades, Cotação do Café e Redação Agro são tratados como fontes prioritárias quando respondem normalmente.',
      },
      {
        title: 'Disponível com restrições',
        text: 'INMET depende da distância e disponibilidade da estação. NASA GIBS e satélite podem variar por nuvens, horário e cobertura.',
      },
      {
        title: 'Fallback',
        text: 'Quando uma fonte falha, o app usa dados salvos, fontes alternativas ou mostra claramente que o dado está indisponível.',
      },
    ],
  },
  forecastLimitations: {
    title: 'Limitações das previsões',
    kicker: 'Transparência',
    summary: 'Previsão climática ajuda a decidir melhor, mas não é certeza absoluta.',
    Icon: AlertTriangle,
    sections: [
      {
        title: 'O que pode variar',
        text: 'Previsões mudam ao longo do dia, chuva localizada pode escapar dos modelos, radar pode ter atraso e estações podem estar distantes da fazenda.',
      },
      {
        title: 'Satélite e radar',
        text: 'Dados de satélite variam conforme nuvens, horário, resolução e cobertura. Radar visual é apoio, não garantia.',
      },
      {
        title: 'Recomendações',
        text: 'As recomendações são apoio operacional. O resultado agrícola depende de manejo, solo, cultura, tecnologia, pragas, logística e decisão técnica.',
      },
    ],
  },
  farms: {
    title: 'Minhas fazendas',
    kicker: 'Conta e fazenda',
    summary: 'Gerencie propriedades, localização operacional e fazenda principal.',
    Icon: Sprout,
    actions: [
      { label: 'Adicionar fazenda', path: '/fazenda/nova' },
      { label: 'Editar na conta', path: '/conta', variant: 'secondary' },
    ],
    sections: [
      {
        title: 'O que aparece aqui',
        text: 'Fazendas cadastradas, município, culturas, modo de localização, status e ações de edição.',
      },
      {
        title: 'Localização principal',
        text: 'A localização da fazenda alimenta clima, radar, alertas, fontes próximas e recomendações.',
      },
    ],
  },
  crops: {
    title: 'Culturas cadastradas',
    kicker: 'Conta e fazenda',
    summary: 'Culturas ajudam o app a ajustar recomendações, alertas e mercado.',
    Icon: Sprout,
    actions: [{ label: 'Gerenciar áreas', path: '/talhoes' }],
    sections: [
      {
        title: 'Culturas monitoradas',
        text: 'Café Conilon, Banana, Tomate, Gengibre, Pimenta, Mamão e outras culturas podem ser cadastradas nas áreas de cultivo.',
      },
      {
        title: 'Como usamos',
        text: 'Cada cultura influencia risco climático, janela operacional e prioridade no Mercado.',
      },
    ],
  },
  alertPreferences: {
    title: 'Preferências de alerta',
    kicker: 'Alertas',
    summary: 'Escolha quais alertas deseja receber e com qual frequência.',
    Icon: Bell,
    actions: [{ label: 'Abrir alertas', path: '/alertas' }],
    sections: [
      {
        title: 'Alertas climáticos',
        text: 'Chuva forte, vento, temperatura, pulverização, irrigação e mercado agrícola.',
      },
      {
        title: 'Frequência e silêncio',
        text: 'Configuração futura: imediatamente, resumo diário, apenas graves e horário silencioso.',
      },
    ],
  },
  help: {
    title: 'Central de ajuda',
    kicker: 'Suporte',
    summary: 'Respostas rápidas para dúvidas de localização, previsão, radar, mercado, alertas e conta.',
    Icon: HelpCircle,
    actions: [
      { label: 'Reportar erro', path: '/report-problem' },
      { label: 'Enviar sugestão', path: '/feedback', variant: 'secondary' },
    ],
    sections: [
      {
        title: 'Primeiros passos',
        text: 'Cadastre uma fazenda, ajuste localização, crie áreas de cultivo e acompanhe recomendações do dia.',
      },
      {
        title: 'Perguntas frequentes',
        text: 'Como o app escolhe minha localização? Por que a previsão mudou? Por que o INMET aparece indisponível? Como desativar notificações?',
      },
    ],
  },
  reportProblem: {
    title: 'Reportar erro',
    kicker: 'Suporte',
    summary: 'Envie problemas reais para melhorar previsão, radar, mercado, localização e login.',
    Icon: AlertTriangle,
    actions: [{ label: 'Enviar pelo feedback', path: '/feedback' }],
    sections: [
      {
        title: 'Tipos de problema',
        text: 'Previsão errada, radar não carregou, mercado não atualizou, localização incorreta, erro no login ou outro.',
      },
      {
        title: 'Dados técnicos opcionais',
        text: 'Versão do app, navegador, sistema, rota atual, horário do erro e status das APIs ajudam a resolver mais rápido.',
      },
    ],
  },
  contact: {
    title: 'Contato',
    kicker: 'Suporte',
    summary: 'Precisa falar com a equipe do app? Envie uma mensagem ou sugestão.',
    Icon: HelpCircle,
    actions: [{ label: 'Enviar sugestão', path: '/feedback' }],
    sections: [
      {
        title: 'Canal de contato',
        text: 'Na primeira versão, use a tela de feedback para enviar sugestão, erro ou mensagem para a equipe.',
      },
      {
        title: 'Atendimento',
        text: 'Projeto focado em produtores do Espírito Santo, com prioridade para clima, radar, alertas e mercado agrícola.',
      },
    ],
  },
  about: {
    title: `Sobre o ${APP_NAME}`,
    kicker: 'Informações do app',
    summary: 'O app nasceu para ajudar produtores do Espírito Santo a tomar decisões melhores com clima, radar, alertas e dados agrícolas.',
    Icon: Info,
    sections: [
      {
        title: 'Missão',
        text: 'Transformar informações climáticas complexas em recomendações simples para proteger a safra.',
      },
      {
        title: 'Para quem é',
        text: 'Produtores, técnicos e equipes que precisam acompanhar clima, radar, mercado e alertas por fazenda e cultura.',
      },
      {
        title: 'Versão',
        text: `Versão atual: ${APP_VERSION}.`,
      },
    ],
  },
  terms: {
    title: 'Termos de uso',
    kicker: 'Informações legais',
    summary: 'Regras de uso do app, responsabilidades e limitações das previsões e recomendações.',
    Icon: ShieldCheck,
    sections: [
      {
        title: 'Uso do aplicativo',
        text: 'O app fornece informações e recomendações de apoio, mas não garante resultado agrícola, climático ou financeiro.',
      },
      {
        title: 'Conta e dados da fazenda',
        text: 'O usuário é responsável por manter informações de fazenda, localização e culturas atualizadas.',
      },
      {
        title: 'Serviços externos',
        text: 'Algumas funções dependem de APIs externas. Indisponibilidades podem afetar previsão, radar, mercado e mapas.',
      },
      {
        title: 'Encerramento',
        text: 'O usuário pode solicitar exclusão de conta e dados conforme regras aplicáveis.',
      },
    ],
  },
}

export function FooterInfoPage({ page }: { page: InfoPageKey }) {
  const { farm } = useCurrentFarm()
  const { fields } = useFields()
  const { settings } = useUserSettings()
  const content = infoPages[page]
  const Icon = content.Icon

  return (
    <section className="info-page">
      <header className="info-page-hero">
        <span>
          <Icon size={20} aria-hidden="true" />
          {content.kicker}
        </span>
        <h1>{content.title}</h1>
        <p>{content.summary}</p>
        {content.actions ? (
          <div>
            {content.actions.map((action) => (
              <LinkButton key={action.path + action.label} to={action.path} variant={action.variant ?? 'primary'}>
                {action.label}
              </LinkButton>
            ))}
          </div>
        ) : null}
      </header>

      {page === 'permissions' || page === 'consents' || page === 'farms' || page === 'crops' || page === 'alertPreferences' ? (
        <div className="info-status-grid">
          <Card>
            <strong>Fazenda atual</strong>
            <span>{farm ? `${farm.name} · ${farm.locationLabel}` : 'Nenhuma fazenda cadastrada'}</span>
          </Card>
          <Card>
            <strong>Áreas/culturas</strong>
            <span>{fields.length ? `${fields.length} área(s): ${Array.from(new Set(fields.map((field) => field.crop))).join(', ')}` : 'Nenhuma área cadastrada'}</span>
          </Card>
          <Card>
            <strong>Alertas</strong>
            <span>{settings.pushNotifications ? 'Notificações ativadas nas preferências' : 'Notificações desativadas nas preferências'}</span>
          </Card>
        </div>
      ) : null}

      <div className="info-section-grid">
        {content.sections.map((section) => (
          <Card className="info-section-card" key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.text}</p>
            {section.items ? (
              <ul>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </Card>
        ))}
      </div>

      {page === 'deleteAccount' ? (
        <Card className="delete-account-box">
          <h2>Confirmação necessária</h2>
          <p>Quando a exclusão real estiver conectada ao backend, o app exigirá digitar EXCLUIR antes de continuar.</p>
          <Button type="button" variant="danger">Excluir conta</Button>
        </Card>
      ) : null}

      <p className="info-page-note">
        <Link to="/privacy">Privacidade</Link> · <Link to="/terms">Termos</Link> · <Link to="/help">Suporte</Link>
      </p>
    </section>
  )
}
