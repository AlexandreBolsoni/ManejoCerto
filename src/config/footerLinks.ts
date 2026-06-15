export type FooterLink = {
  label: string
  path: string
}

export type FooterLinkSection = {
  title: string
  links: FooterLink[]
}

export const footerLinkSections: FooterLinkSection[] = [
  {
    title: 'Privacidade e segurança',
    links: [
      { label: 'Política de privacidade', path: '/privacy' },
      { label: 'Cookies e dados locais', path: '/cookies' },
      { label: 'Permissões do app', path: '/permissions' },
      { label: 'Gerenciar consentimentos', path: '/consents' },
      { label: 'Excluir minha conta', path: '/delete-account' },
    ],
  },
  {
    title: 'Dados e fontes',
    links: [
      { label: 'Fontes climáticas', path: '/data-sources' },
      { label: 'Como calculamos alertas', path: '/alerts-methodology' },
      { label: 'Status das APIs', path: '/api-status' },
      { label: 'Limitações das previsões', path: '/forecast-limitations' },
    ],
  },
  {
    title: 'Conta e fazenda',
    links: [
      { label: 'Minha conta', path: '/conta' },
      { label: 'Minhas fazendas', path: '/farms' },
      { label: 'Culturas cadastradas', path: '/crops' },
      { label: 'Preferências de alerta', path: '/alert-preferences' },
    ],
  },
  {
    title: 'Suporte',
    links: [
      { label: 'Central de ajuda', path: '/help' },
      { label: 'Reportar erro', path: '/report-problem' },
      { label: 'Enviar sugestão', path: '/feedback' },
      { label: 'Contato', path: '/contact' },
    ],
  },
  {
    title: 'Informações do app',
    links: [
      { label: 'Sobre o NimbuES', path: '/about' },
      { label: 'Termos de uso', path: '/terms' },
      { label: 'Versão do app', path: '/about' },
    ],
  },
]

export const publicFooterLinks: FooterLink[] = [
  { label: 'Privacidade', path: '/privacy' },
  { label: 'Cookies', path: '/cookies' },
  { label: 'Termos', path: '/terms' },
  { label: 'Suporte', path: '/help' },
]
