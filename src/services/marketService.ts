import { demoQuotes } from '../lib/mockData'
import type { MarketFallbackLevel, MarketQuote, MarketSourceType, StateMarketProduct, StateMarketProfile } from '../types'
import { marketPriceService } from './marketPriceService'

const STORAGE_PREFIX = 'nimbo:market-quotes:v2'
const MUNICIPALITY_STATE_CACHE_KEY = 'nimbo:municipality-state:v1'
const IBGE_MUNICIPALITIES_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome'

const stateAliases: Record<string, string> = {
  ac: 'AC',
  acre: 'AC',
  al: 'AL',
  alagoas: 'AL',
  ap: 'AP',
  amapa: 'AP',
  am: 'AM',
  amazonas: 'AM',
  ba: 'BA',
  bahia: 'BA',
  ce: 'CE',
  ceara: 'CE',
  df: 'DF',
  distrito_federal: 'DF',
  es: 'ES',
  espirito_santo: 'ES',
  go: 'GO',
  goias: 'GO',
  ma: 'MA',
  maranhao: 'MA',
  mt: 'MT',
  mato_grosso: 'MT',
  ms: 'MS',
  mato_grosso_do_sul: 'MS',
  mg: 'MG',
  minas_gerais: 'MG',
  pa: 'PA',
  para: 'PA',
  pb: 'PB',
  paraiba: 'PB',
  pr: 'PR',
  parana: 'PR',
  pe: 'PE',
  pernambuco: 'PE',
  pi: 'PI',
  piaui: 'PI',
  rj: 'RJ',
  rio_de_janeiro: 'RJ',
  rn: 'RN',
  rio_grande_do_norte: 'RN',
  rs: 'RS',
  rio_grande_do_sul: 'RS',
  ro: 'RO',
  rondonia: 'RO',
  rr: 'RR',
  roraima: 'RR',
  sc: 'SC',
  santa_catarina: 'SC',
  sp: 'SP',
  sao_paulo: 'SP',
  se: 'SE',
  sergipe: 'SE',
  to: 'TO',
  tocantins: 'TO',
}

const stateNames: Record<string, string> = {
  AC: 'Acre',
  AL: 'Alagoas',
  AP: 'Amapá',
  AM: 'Amazonas',
  BA: 'Bahia',
  CE: 'Ceará',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  GO: 'Goiás',
  MA: 'Maranhão',
  MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais',
  PA: 'Pará',
  PB: 'Paraíba',
  PR: 'Paraná',
  PE: 'Pernambuco',
  PI: 'Piauí',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul',
  RO: 'Rondônia',
  RR: 'Roraima',
  SC: 'Santa Catarina',
  SP: 'São Paulo',
  SE: 'Sergipe',
  TO: 'Tocantins',
}

const stateProductionTypes: Record<string, string[]> = {
  AC: ['Mandioca', 'Milho', 'Banana', 'Café Conilon', 'Açaí', 'Castanha-do-brasil', 'Pecuária'],
  AL: ['Cana-de-açúcar', 'Coco', 'Mandioca', 'Milho', 'Feijão', 'Pecuária'],
  AP: ['Açaí', 'Mandioca', 'Arroz', 'Milho', 'Dendê', 'Pecuária'],
  AM: ['Mandioca', 'Açaí', 'Banana', 'Guaraná', 'Laranja', 'Pecuária'],
  BA: ['Soja', 'Algodão', 'Cacau', 'Café Arábica', 'Café Conilon', 'Milho', 'Feijão', 'Fruticultura', 'Cana-de-açúcar', 'Pecuária'],
  CE: ['Castanha-de-caju', 'Milho', 'Feijão', 'Mandioca', 'Coco', 'Fruticultura', 'Pecuária'],
  DF: ['Soja', 'Milho', 'Feijão', 'Hortaliças', 'Café Arábica', 'Pecuária'],
  ES: ['Café Conilon', 'Café Arábica', 'Mamão', 'Pimenta-do-reino', 'Gengibre', 'Banana', 'Cacau', 'Cana-de-açúcar', 'Eucalipto', 'Tomate', 'Inhame', 'Pimenta-rosa', 'Pecuária'],
  GO: ['Soja', 'Milho', 'Cana-de-açúcar', 'Tomate', 'Feijão', 'Sorgo', 'Algodão', 'Pecuária'],
  MA: ['Soja', 'Milho', 'Arroz', 'Mandioca', 'Algodão', 'Cana-de-açúcar', 'Pecuária'],
  MT: ['Soja', 'Milho', 'Algodão', 'Sorgo', 'Feijão', 'Cana-de-açúcar', 'Girassol', 'Pecuária'],
  MS: ['Soja', 'Milho', 'Cana-de-açúcar', 'Eucalipto', 'Mandioca', 'Pecuária'],
  MG: ['Café Arábica', 'Café Conilon', 'Soja', 'Milho', 'Feijão', 'Cana-de-açúcar', 'Batata', 'Pecuária'],
  PA: ['Açaí', 'Mandioca', 'Cacau', 'Dendê', 'Pimenta-do-reino', 'Soja', 'Milho', 'Pecuária'],
  PB: ['Cana-de-açúcar', 'Milho', 'Feijão', 'Mandioca', 'Abacaxi', 'Pecuária'],
  PR: ['Soja', 'Milho', 'Trigo', 'Feijão', 'Café Arábica', 'Mandioca', 'Hortaliças', 'Pecuária'],
  PE: ['Cana-de-açúcar', 'Uva', 'Manga', 'Goiaba', 'Coco', 'Mandioca', 'Milho', 'Pecuária'],
  PI: ['Soja', 'Milho', 'Feijão', 'Mandioca', 'Algodão', 'Caju', 'Pecuária'],
  RJ: ['Cana-de-açúcar', 'Café Arábica', 'Tomate', 'Banana', 'Coco', 'Hortaliças', 'Pecuária'],
  RN: ['Melão', 'Melancia', 'Caju', 'Coco', 'Mandioca', 'Milho', 'Pecuária'],
  RS: ['Soja', 'Arroz', 'Milho', 'Trigo', 'Uva', 'Tabaco', 'Oliveira', 'Pecuária'],
  RO: ['Café Conilon', 'Soja', 'Milho', 'Cacau', 'Mandioca', 'Banana', 'Pecuária'],
  RR: ['Soja', 'Milho', 'Arroz', 'Mandioca', 'Banana', 'Pecuária'],
  SC: ['Milho', 'Soja', 'Arroz', 'Maçã', 'Cebola', 'Tabaco', 'Banana', 'Pecuária'],
  SP: ['Cana-de-açúcar', 'Laranja', 'Café Arábica', 'Soja', 'Milho', 'Tomate', 'Amendoim', 'Hortaliças', 'Pecuária'],
  SE: ['Milho', 'Laranja', 'Cana-de-açúcar', 'Mandioca', 'Coco', 'Feijão', 'Pecuária'],
  TO: ['Soja', 'Milho', 'Arroz', 'Feijão', 'Mandioca', 'Pecuária'],
}

const ufPattern = /\b(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\b/i

type OfficialMarketSource = {
  id: string
  label: string
  type: MarketSourceType
  coverage: string
  priority: 'base' | 'priority_state' | 'future'
  sourceUrl: string
}

const officialMarketSources: OfficialMarketSource[] = [
  {
    id: 'ibge_pam',
    label: 'IBGE PAM',
    type: 'production',
    coverage: 'produção municipal, UF e Brasil',
    priority: 'base',
    sourceUrl: 'https://sidra.ibge.gov.br/pesquisa/pam/tabelas',
  },
  {
    id: 'ibge_localidades',
    label: 'IBGE Localidades',
    type: 'geo_reference',
    coverage: 'UFs, municípios e códigos oficiais',
    priority: 'base',
    sourceUrl: 'https://servicodados.ibge.gov.br/api/docs/localidades',
  },
  {
    id: 'conab_prices',
    label: 'CONAB Preços',
    type: 'farmgate_price',
    coverage: 'preços agropecuários por UF e município',
    priority: 'base',
    sourceUrl: 'https://portaldeinformacoes.conab.gov.br/precos-agropecuarios.html',
  },
  {
    id: 'conab_prohort',
    label: 'CONAB Prohort',
    type: 'wholesale_price',
    coverage: 'hortigranjeiros diários e mensais',
    priority: 'base',
    sourceUrl: 'https://portaldeinformacoes.conab.gov.br/download-arquivos.html',
  },
  {
    id: 'mapa_vbp',
    label: 'MAPA VBP',
    type: 'economic_weight',
    coverage: 'valor bruto da produção por Brasil e UF',
    priority: 'base',
    sourceUrl: 'https://www.gov.br/agricultura/pt-br/assuntos/politica-agricola/valor-bruto-da-producao-agropecuaria-vbp',
  },
  {
    id: 'ceagesp',
    label: 'CEAGESP',
    type: 'wholesale_price',
    coverage: 'atacado SP',
    priority: 'priority_state',
    sourceUrl: 'https://ceagesp.gov.br/cotacoes/',
  },
  {
    id: 'ceasa_pr',
    label: 'Ceasa Paraná',
    type: 'wholesale_price',
    coverage: 'atacado PR',
    priority: 'priority_state',
    sourceUrl: 'https://www.ceasa.pr.gov.br/',
  },
  {
    id: 'ceasa_go',
    label: 'Ceasa Goiás',
    type: 'wholesale_price',
    coverage: 'atacado GO',
    priority: 'priority_state',
    sourceUrl: 'https://goias.gov.br/ceasa/cotacoes-diarias/',
  },
  {
    id: 'sc_market',
    label: 'Infoagro / Observatório SC',
    type: 'bulletin',
    coverage: 'safras, preços, custos e mercado em SC',
    priority: 'priority_state',
    sourceUrl: 'https://www.infoagro.sc.gov.br/',
  },
]

const sourceTypeLabels: Record<MarketSourceType, string> = {
  advisory_only: 'contexto',
  bulletin: 'boletim',
  economic_weight: 'peso econômico',
  farmgate_price: 'produtor',
  geo_reference: 'geografia',
  production: 'produção',
  reference_price: 'referência',
  wholesale_price: 'atacado',
}

const fallbackLevelLabels: Record<MarketFallbackLevel, string> = {
  brasil: 'Brasil',
  macroregion: 'macrorregião',
  municipality: 'município',
  unavailable: 'sem cotação',
  uf: 'referência UF',
  wholesale: 'entreposto',
}

const cropTemplates: Record<string, { unit: string; base: number }> = {
  Abacaxi: { unit: '/cx 20kg', base: 54 },
  Alface: { unit: '/cx', base: 32 },
  Algodão: { unit: '/@', base: 152.4 },
  Arroz: { unit: '/sc 50kg', base: 118 },
  Banana: { unit: '/cx 20kg', base: 38 },
  Cacau: { unit: '/@', base: 330 },
  Café: { unit: '/sc 60kg', base: 1820 },
  'Café Arábica': { unit: '/sc 60kg', base: 2150 },
  'Café Conilon': { unit: '/sc 60kg', base: 1560 },
  'Cana-de-açúcar': { unit: '/t', base: 148 },
  Coco: { unit: '/un mil', base: 980 },
  Eucalipto: { unit: '/m³', base: 118 },
  Feijão: { unit: '/sc 60kg', base: 245 },
  Gengibre: { unit: '/cx 20kg', base: 145 },
  Goiaba: { unit: '/cx 20kg', base: 72 },
  Inhame: { unit: '/cx 20kg', base: 96 },
  Laranja: { unit: '/cx 40,8kg', base: 58 },
  Maçã: { unit: '/cx 18kg', base: 112 },
  Mamão: { unit: '/cx 18kg', base: 64 },
  Maracujá: { unit: '/cx 13kg', base: 85 },
  Milho: { unit: '/sc 60kg', base: 62.8 },
  Morango: { unit: '/kg', base: 18 },
  'Pimenta-do-reino': { unit: '/kg', base: 24.5 },
  'Pimenta-rosa': { unit: '/kg', base: 38 },
  Repolho: { unit: '/cx', base: 42 },
  Soja: { unit: '/sc 60kg', base: 134.2 },
  Sorgo: { unit: '/sc 60kg', base: 52 },
  Tomate: { unit: '/cx 20kg', base: 92 },
  Trigo: { unit: '/sc 60kg', base: 78 },
}

type IbgeMunicipality = {
  nome: string
  microrregiao?: {
    mesorregiao?: {
      UF?: {
        sigla?: string
      }
    }
  } | null
  'regiao-imediata'?: {
    'regiao-intermediaria'?: {
      UF?: {
        sigla?: string
      }
    }
  }
}

const brazilProfile: StateMarketProfile = {
  state: 'BR',
  stateName: 'Brasil',
  title: 'Produtos agrícolas de referência nacional',
  summary: 'Sem uma fazenda cadastrada, o NibusES mostra uma cesta nacional básica. Ao cadastrar uma localidade capixaba, o painel passa a priorizar produtos regionais.',
  highlights: ['Grãos', 'Café', 'Algodão', 'Cana-de-açúcar'],
  sources: ['Base NibusES inicial, IBGE PAM e indicadores de mercado públicos'],
  products: [
    {
      crop: 'Soja',
      category: 'Grãos',
      priority: 1,
      relevanceLabel: 'Principal commodity agrícola nacional.',
      stateShareLabel: 'Referência Brasil',
      whyMonitor: 'Sensível a dólar, Chicago, frete e clima no Centro-Oeste/Sul.',
    },
    {
      crop: 'Milho',
      category: 'Grãos',
      priority: 2,
      relevanceLabel: 'Base para ração e segunda safra.',
      stateShareLabel: 'Referência Brasil',
      whyMonitor: 'Preço reage a oferta regional, demanda animal e janela de colheita.',
    },
    {
      crop: 'Café',
      category: 'Café',
      priority: 3,
      relevanceLabel: 'Produto exportador de alta relevância.',
      stateShareLabel: 'Referência Brasil',
      whyMonitor: 'Muito sensível a florada, seca, geada e câmbio.',
    },
  ],
}

const stateProfiles: Record<string, StateMarketProfile> = {
  ES: {
    state: 'ES',
    stateName: 'Espírito Santo',
    title: 'Produtos agrícolas do Espírito Santo',
    summary:
      'O agro capixaba combina cafeicultura forte, fruticultura exportadora, especiarias, raízes e olericultura. O NibusES prioriza produtos que fazem sentido para clima, risco operacional e decisão comercial local.',
    highlights: ['Café Conilon', 'Mamão', 'Pimenta-do-reino', 'Gengibre'],
    sources: ['Incaper: cafeicultura conilon e arábica', 'SEAG/Plano ABC ES com base IBGE-PAM', 'Embrapa/Revista de Política Agrícola'],
    products: [
      {
        crop: 'Café Conilon',
        category: 'Café',
        priority: 1,
        relevanceLabel: 'Carro-chefe do agro capixaba.',
        stateShareLabel: 'ES responde por cerca de 70% do conilon nacional.',
        whyMonitor: 'Preço e qualidade reagem a chuva na florada, seca, irrigação e janela de colheita.',
        regions: ['Noroeste', 'Litoral Norte'],
      },
      {
        crop: 'Café Arábica',
        category: 'Café',
        priority: 2,
        relevanceLabel: 'Forte nas regiões de montanha.',
        stateShareLabel: 'ES está entre os grandes produtores nacionais.',
        whyMonitor: 'Sensível a temperatura, geada em altitude, chuva na florada e qualidade da bebida.',
        regions: ['Região Serrana', 'Caparaó', 'Sul'],
      },
      {
        crop: 'Mamão',
        category: 'Fruticultura',
        priority: 3,
        relevanceLabel: 'Produto de exportação e alta perecibilidade.',
        stateShareLabel: 'ES é destaque nacional em mamão papaya.',
        whyMonitor: 'Chuva, umidade e logística impactam qualidade, doenças e janela de comercialização.',
        regions: ['Linhares', 'São Mateus', 'Litoral Norte'],
      },
      {
        crop: 'Pimenta-do-reino',
        category: 'Especiarias',
        priority: 4,
        relevanceLabel: 'Cultura de alto valor no norte capixaba.',
        stateShareLabel: 'ES tem forte participação nacional na cultura.',
        whyMonitor: 'Doenças, umidade e secagem pós-colheita alteram risco e preço recebido.',
        regions: ['Litoral Norte', 'Noroeste'],
      },
      {
        crop: 'Gengibre',
        category: 'Raízes e especiarias',
        priority: 5,
        relevanceLabel: 'Produto relevante para exportação.',
        stateShareLabel: 'ES é liderança nacional na cadeia de gengibre.',
        whyMonitor: 'Chuva excessiva e solo encharcado afetam qualidade, colheita e conservação.',
      },
      {
        crop: 'Banana',
        category: 'Fruticultura',
        priority: 6,
        relevanceLabel: 'Presença importante no abastecimento regional.',
        stateShareLabel: 'Cultura permanente relevante no estado.',
        whyMonitor: 'Vento forte, chuva e umidade elevam risco de queda e doenças foliares.',
      },
      {
        crop: 'Cacau',
        category: 'Fruticultura',
        priority: 7,
        relevanceLabel: 'Cadeia com peso no norte capixaba.',
        stateShareLabel: 'Relevante na pauta agrícola estadual.',
        whyMonitor: 'Umidade, chuva e manejo sanitário influenciam produtividade e qualidade.',
        regions: ['Linhares', 'Litoral Norte'],
      },
      {
        crop: 'Cana-de-açúcar',
        category: 'Agroindústria',
        priority: 8,
        relevanceLabel: 'Impacto econômico regional e industrial.',
        stateShareLabel: 'Cultura tradicional do estado.',
        whyMonitor: 'Janela de corte depende de chuva, maturação e logística.',
      },
      {
        crop: 'Eucalipto',
        category: 'Silvicultura',
        priority: 9,
        relevanceLabel: 'Base para celulose e madeira.',
        stateShareLabel: 'Silvicultura com forte impacto econômico.',
        whyMonitor: 'Seca prolongada e incêndio alteram risco operacional e planejamento.',
      },
      {
        crop: 'Tomate',
        category: 'Olericultura',
        priority: 10,
        relevanceLabel: 'Hortaliça importante para abastecimento regional.',
        stateShareLabel: 'Destaque na olericultura capixaba.',
        whyMonitor: 'Chuva, umidade e calor pressionam doenças e variação de oferta.',
      },
      {
        crop: 'Inhame',
        category: 'Raízes',
        priority: 11,
        relevanceLabel: 'Raiz relevante na produção local.',
        stateShareLabel: 'Cultura de base alimentar regional.',
        whyMonitor: 'Excesso de chuva e colheita em solo úmido alteram qualidade e oferta.',
      },
      {
        crop: 'Pimenta-rosa',
        category: 'Especiarias',
        priority: 12,
        relevanceLabel: 'Produto de nicho com alto valor agregado.',
        stateShareLabel: 'Destaque capixaba em aroeira/pimenta-rosa.',
        whyMonitor: 'Qualidade visual e secagem são sensíveis à chuva na colheita.',
      },
    ],
  },
  MT: {
    state: 'MT',
    stateName: 'Mato Grosso',
    title: 'Produtos agrícolas de Mato Grosso',
    summary: 'Perfil concentrado em grãos, algodão, pecuária integrada e culturas de segunda safra.',
    highlights: ['Soja', 'Milho', 'Algodão', 'Sorgo'],
    sources: ['Base NibusES inicial, IBGE PAM e boletins estaduais'],
    products: [
      {
        crop: 'Soja',
        category: 'Grãos',
        priority: 1,
        relevanceLabel: 'Principal produto agrícola do estado.',
        stateShareLabel: 'Liderança nacional em produção.',
        whyMonitor: 'Chuva no plantio, seca e logística definem risco e basis regional.',
      },
      {
        crop: 'Milho',
        category: 'Grãos',
        priority: 2,
        relevanceLabel: 'Forte na segunda safra.',
        stateShareLabel: 'Grande participação nacional.',
        whyMonitor: 'Janela de plantio e chuva no enchimento alteram produtividade e preço.',
      },
      {
        crop: 'Algodão',
        category: 'Fibra',
        priority: 3,
        relevanceLabel: 'Cultura de alto valor e tecnologia.',
        stateShareLabel: 'Destaque nacional.',
        whyMonitor: 'Chuva na colheita e qualidade da fibra mudam preço recebido.',
      },
      {
        crop: 'Sorgo',
        category: 'Grãos',
        priority: 4,
        relevanceLabel: 'Alternativa de safrinha e ração.',
        stateShareLabel: 'Relevância regional.',
        whyMonitor: 'Mercado local acompanha milho, seca e demanda animal.',
      },
    ],
  },
  SP: {
    state: 'SP',
    stateName: 'São Paulo',
    title: 'Produtos agrícolas de São Paulo',
    summary: 'Perfil com cana-de-açúcar, citros, café, grãos e hortifrúti com apoio de CEAGESP para referência atacadista.',
    highlights: ['Cana-de-açúcar', 'Laranja', 'Café Arábica', 'Tomate'],
    sources: ['IBGE PAM', 'CONAB Preços', 'MAPA VBP', 'CEAGESP cotações'],
    products: [
      {
        crop: 'Cana-de-açúcar',
        category: 'Agroindústria',
        priority: 1,
        relevanceLabel: 'Principal cadeia agrícola paulista.',
        stateShareLabel: 'Alto peso econômico estadual.',
        whyMonitor: 'Safra, ATR, chuva e logística industrial afetam preço e janela de corte.',
      },
      {
        crop: 'Laranja',
        category: 'Citricultura',
        priority: 2,
        relevanceLabel: 'Cadeia exportadora e industrial forte no estado.',
        stateShareLabel: 'Destaque nacional em citros.',
        whyMonitor: 'Oferta, qualidade, greening e demanda industrial mexem com a referência regional.',
      },
      {
        crop: 'Café Arábica',
        category: 'Café',
        priority: 3,
        relevanceLabel: 'Importante em regiões cafeeiras paulistas.',
        stateShareLabel: 'Referência regional conectada a cafés finos.',
        whyMonitor: 'Florada, seca e qualidade da bebida alteram preço recebido.',
      },
      {
        crop: 'Tomate',
        category: 'Hortifrúti',
        priority: 4,
        relevanceLabel: 'Produto sensível à oferta de atacado.',
        stateShareLabel: 'CEAGESP entra como referência atacadista, não preço ao produtor.',
        whyMonitor: 'Preço reage rápido a chuva, calor, qualidade e volume nos entrepostos.',
      },
      {
        crop: 'Milho',
        category: 'Grãos',
        priority: 5,
        relevanceLabel: 'Base de ração e mercado regional.',
        stateShareLabel: 'Referência UF via fontes nacionais.',
        whyMonitor: 'Oferta local, frete e demanda animal mudam a leitura comercial.',
      },
    ],
  },
  GO: {
    state: 'GO',
    stateName: 'Goiás',
    title: 'Produtos agrícolas de Goiás',
    summary: 'Perfil agropecuário com grãos, cana, tomate industrial e hortifrúti com cotação diária da Ceasa GO.',
    highlights: ['Soja', 'Milho', 'Tomate', 'Cana-de-açúcar'],
    sources: ['IBGE PAM', 'CONAB Preços', 'MAPA VBP', 'Ceasa Goiás'],
    products: [
      {
        crop: 'Soja',
        category: 'Grãos',
        priority: 1,
        relevanceLabel: 'Produto-chave da agricultura goiana.',
        stateShareLabel: 'Referência UF via CONAB quando disponível.',
        whyMonitor: 'Chuva, câmbio, frete e demanda exportadora alteram preço regional.',
      },
      {
        crop: 'Milho',
        category: 'Grãos',
        priority: 2,
        relevanceLabel: 'Segunda safra e demanda animal relevantes.',
        stateShareLabel: 'Forte presença no estado.',
        whyMonitor: 'Janela de plantio, seca e consumo local pressionam a cotação.',
      },
      {
        crop: 'Tomate',
        category: 'Hortifrúti',
        priority: 3,
        relevanceLabel: 'Produto importante na indústria e no abastecimento.',
        stateShareLabel: 'Ceasa GO pode aprofundar referência atacadista.',
        whyMonitor: 'Perecibilidade e clima mexem rapidamente com oferta e preço.',
      },
      {
        crop: 'Cana-de-açúcar',
        category: 'Agroindústria',
        priority: 4,
        relevanceLabel: 'Cadeia relevante no sudoeste e sul goiano.',
        stateShareLabel: 'Alto peso econômico regional.',
        whyMonitor: 'Chuva na colheita, ATR e logística industrial alteram decisão comercial.',
      },
    ],
  },
  PR: {
    state: 'PR',
    stateName: 'Paraná',
    title: 'Produtos agrícolas do Paraná',
    summary: 'Perfil com grãos, trigo, feijão, café e hortifrúti, combinando CONAB, DERAL e Ceasa Paraná.',
    highlights: ['Soja', 'Milho', 'Trigo', 'Feijão'],
    sources: ['IBGE PAM', 'CONAB Preços', 'MAPA VBP', 'DERAL PR', 'Ceasa Paraná'],
    products: [
      {
        crop: 'Soja',
        category: 'Grãos',
        priority: 1,
        relevanceLabel: 'Principal cultura comercial paranaense.',
        stateShareLabel: 'Referência UF via fontes nacionais.',
        whyMonitor: 'Oferta regional, porto, câmbio e clima mexem no basis.',
      },
      {
        crop: 'Milho',
        category: 'Grãos',
        priority: 2,
        relevanceLabel: 'Forte nas safras de verão e inverno.',
        stateShareLabel: 'Base para ração e cadeias de proteína.',
        whyMonitor: 'Demanda local e janela de colheita mudam o preço disponível.',
      },
      {
        crop: 'Trigo',
        category: 'Grãos de inverno',
        priority: 3,
        relevanceLabel: 'Cultura estratégica no inverno.',
        stateShareLabel: 'Destaque nacional em trigo.',
        whyMonitor: 'Geada, chuva na colheita e qualidade industrial influenciam preço.',
      },
      {
        crop: 'Feijão',
        category: 'Grãos alimentares',
        priority: 4,
        relevanceLabel: 'Mercado regional volátil e sensível a oferta.',
        stateShareLabel: 'Presença importante no estado.',
        whyMonitor: 'Chuva, qualidade do grão e sazonalidade alteram valores rapidamente.',
      },
    ],
  },
  SC: {
    state: 'SC',
    stateName: 'Santa Catarina',
    title: 'Produtos agrícolas de Santa Catarina',
    summary: 'Perfil de milho, soja, arroz, maçã, cebola e cadeias integradas com apoio de Infoagro e Observatório Agro.',
    highlights: ['Milho', 'Soja', 'Arroz', 'Maçã'],
    sources: ['IBGE PAM', 'CONAB Preços', 'MAPA VBP', 'Infoagro/Epagri', 'Observatório Agro Catarinense'],
    products: [
      {
        crop: 'Milho',
        category: 'Grãos',
        priority: 1,
        relevanceLabel: 'Cultura essencial para cadeias de proteína animal.',
        stateShareLabel: 'Alta relevância para abastecimento local.',
        whyMonitor: 'Demanda animal, clima e oferta regional afetam compra e venda.',
      },
      {
        crop: 'Soja',
        category: 'Grãos',
        priority: 2,
        relevanceLabel: 'Produto comercial relevante no oeste e planalto.',
        stateShareLabel: 'Referência UF via fontes nacionais.',
        whyMonitor: 'Preço acompanha câmbio, porto, frete e janela de colheita.',
      },
      {
        crop: 'Arroz',
        category: 'Grãos alimentares',
        priority: 3,
        relevanceLabel: 'Cultura importante em áreas irrigadas.',
        stateShareLabel: 'Presença forte no Sul do país.',
        whyMonitor: 'Nível de água, qualidade e oferta regional alteram mercado.',
      },
      {
        crop: 'Maçã',
        category: 'Fruticultura',
        priority: 4,
        relevanceLabel: 'Cadeia frutícola de alto valor.',
        stateShareLabel: 'Destaque nacional em maçã.',
        whyMonitor: 'Frio, granizo, classificação e armazenagem alteram preço.',
      },
    ],
  },
}

const fallbackByState: Record<string, StateMarketProfile> = {}
let municipalityStateCache: Record<string, string> | null = null

function normalizeState(value?: string | null) {
  if (!value) return 'BR'
  const ufMatch = value.match(ufPattern)
  if (ufMatch?.[1]) return ufMatch[1].toUpperCase()

  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')

  const directAlias = stateAliases[normalized]
  if (directAlias) return directAlias

  const nameAlias = Object.entries(stateAliases)
    .filter(([alias]) => alias.length > 2)
    .sort(([left], [right]) => right.length - left.length)
    .find(([alias]) => normalized.includes(alias))

  return nameAlias?.[1] ?? value.toUpperCase()
}

function normalizeLookup(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

function ufFromMunicipality(municipality: IbgeMunicipality) {
  return municipality.microrregiao?.mesorregiao?.UF?.sigla ?? municipality['regiao-imediata']?.['regiao-intermediaria']?.UF?.sigla ?? ''
}

async function loadMunicipalityStateMap() {
  if (municipalityStateCache) return municipalityStateCache

  try {
    const stored = localStorage.getItem(MUNICIPALITY_STATE_CACHE_KEY)
    if (stored) {
      municipalityStateCache = JSON.parse(stored) as Record<string, string>
      return municipalityStateCache
    }
  } catch {
    // Cache best-effort only.
  }

  const response = await fetch(IBGE_MUNICIPALITIES_URL)
  if (!response.ok) throw new Error(`IBGE municipios respondeu ${response.status}`)

  const municipalities = (await response.json()) as IbgeMunicipality[]
  municipalityStateCache = municipalities.reduce<Record<string, string>>((current, municipality) => {
    const uf = ufFromMunicipality(municipality)
    if (uf) current[normalizeLookup(municipality.nome)] = uf
    return current
  }, {})

  try {
    localStorage.setItem(MUNICIPALITY_STATE_CACHE_KEY, JSON.stringify(municipalityStateCache))
  } catch {
    // Cache best-effort only.
  }

  return municipalityStateCache
}

function storageKey(state = 'BR') {
  return `${STORAGE_PREFIX}:${state.toUpperCase()}`
}

function buildStateFallbackProfile(state: string): StateMarketProfile {
  const stateName = stateNames[state] ?? state

  return {
    state,
    stateName,
    title: `Produtos agrícolas de ${stateName}`,
    summary:
      'Cobertura base com produção oficial do IBGE, preços nacionais/UF da CONAB e relevância econômica do MAPA VBP. Conectores estaduais entram quando houver fonte oficial estável.',
    highlights: brazilProfile.highlights,
    sources: ['IBGE PAM', 'IBGE Localidades', 'CONAB Preços', 'CONAB Prohort', 'MAPA VBP'],
    products: brazilProfile.products.map((product) => ({
      ...product,
      stateShareLabel: 'Referência UF via fontes nacionais',
    })),
  }
}

function normalizeCrop(crop: string) {
  return crop
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\W+/g, '-')
    .replace(/^-|-$/g, '')
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', {
    currency: 'BRL',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: 'currency',
  })
}

function stableHash(value: string) {
  return value.split('').reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 2166136261)
}

function referencePriceForCrop(product: StateMarketProduct, stateName: string) {
  const template = cropTemplates[product.crop] ?? { unit: '/unidade', base: 100 }
  const seed = stableHash(`${product.crop}:${stateName}`)
  const regionalFactor = 0.94 + (seed % 1300) / 10_000
  const value = Number((template.base * regionalFactor).toFixed(2))
  const variationPct = Number((((stableHash(`${product.crop}:${stateName}:variation`) % 81) - 40) / 10).toFixed(1))
  return { template, value, variationPct }
}

function referenceHistory(value: number, variationPct: number) {
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const startValue = value / (1 + variationPct / 100 || 1)

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (6 - index))
    const progress = index / 6
    const wave = Math.sin(index * 1.7) * 0.006
    const pointValue = Number((startValue + (value - startValue) * progress + value * wave).toFixed(2))

    return {
      date: date.toISOString(),
      label: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      value: pointValue,
    }
  })
}

function productFromCrop(crop: string, priority: number): StateMarketProduct {
  return {
    crop,
    category: 'Cultura do usuário',
    priority,
    relevanceLabel: 'Cadastrada nas áreas de cultivo do usuário.',
    stateShareLabel: 'Monitoramento personalizado',
    whyMonitor: 'Produto incluído porque aparece no cadastro das áreas de cultivo.',
  }
}

function labelForSourceType(sourceType?: MarketSourceType) {
  return sourceType ? sourceTypeLabels[sourceType] : 'sem fonte'
}

function labelForFallbackLevel(fallbackLevel?: MarketFallbackLevel) {
  return fallbackLevel ? fallbackLevelLabels[fallbackLevel] : 'sem cotação'
}

function quoteStatusLabel(quote: MarketQuote) {
  if (quote.statusLabel) return quote.statusLabel
  if (quote.quoteStatus === 'real' && quote.officialSource) return 'Cotação oficial'
  if (quote.quoteStatus === 'real') return 'Referência pública'
  if (quote.quoteStatus === 'reference') return 'Referência em validação'
  return 'Sem cotação oficial'
}

function quoteTypeLabel(quote: MarketQuote) {
  if (quote.quoteStatus === 'unavailable') return 'sem cotação'
  return labelForSourceType(quote.sourceType)
}

function quoteFallbackLabel(quote: MarketQuote) {
  return labelForFallbackLevel(quote.fallbackLevel)
}

function quoteTrendLabel(quote: MarketQuote) {
  if (quote.quoteStatus === 'unavailable') return 'sem cotação'
  if (quote.trend === 'up') return 'alta'
  if (quote.trend === 'down') return 'queda'
  return 'estável'
}

function quoteMatchesCrop(quote: MarketQuote, crops: string[]) {
  const normalizedQuoteCrop = normalizeCrop(quote.crop)
  return crops.some((crop) => normalizeCrop(crop) === normalizedQuoteCrop)
}

function selectFeaturedQuote(quotes: MarketQuote[], userCrops: string[] = []) {
  return (
    quotes.find((quote) => quote.quoteStatus === 'real' && quoteMatchesCrop(quote, userCrops)) ??
    quotes.find((quote) => quote.quoteStatus === 'reference' && quoteMatchesCrop(quote, userCrops)) ??
    quotes.find((quote) => quoteMatchesCrop(quote, userCrops)) ??
    quotes.find((quote) => quote.quoteStatus === 'real') ??
    quotes.find((quote) => quote.quoteStatus === 'reference') ??
    quotes[0]
  )
}

function createReferenceQuote(product: StateMarketProduct, region: string, stateName: string): MarketQuote {
  const { template, value, variationPct } = referencePriceForCrop(product, stateName)
  const historyPoints = referenceHistory(value, variationPct)
  const quotedAt = new Date()
  quotedAt.setMinutes(0, 0, 0)

  return {
    id: normalizeCrop(product.crop),
    crop: product.crop,
    region,
    price: formatCurrency(value),
    rawPrice: value,
    unit: template.unit,
    variationPct,
    trend: variationPct > 0.01 ? 'up' : variationPct < -0.01 ? 'down' : 'flat',
    history: historyPoints.map((point) => point.value),
    historyByPeriod: {
      annual: historyPoints,
      monthly: historyPoints,
      weekly: historyPoints,
    },
    source: `Referência NibusES v0 · ${stateName}`,
    sourceType: 'reference_price',
    fallbackLevel: stateName === 'Brasil' ? 'brasil' : 'uf',
    officialSource: false,
    statusLabel: 'Referência em validação',
    freshnessLabel: 'Atualizada hoje como referência interna',
    quotedAt: quotedAt.toISOString(),
    quoteStatus: 'reference',
    quoteType: 'Preço indicativo por cultura e UF',
    dataQualityLabel:
      'Referência inicial do NibusES para não deixar a cultura sem preço enquanto o conector público ou regional é validado. Não substitui cotação oficial, contrato ou balcão local.',
    variations: [
      {
        detail: 'referência inicial por cultura/UF',
        label: 'Semana',
        valuePct: variationPct,
      },
    ],
    volumeLabel: product.category,
    basisLabel: product.stateShareLabel ?? 'referência NibusES',
    category: product.category,
    priority: product.priority,
    relevanceLabel: product.relevanceLabel,
    stateShareLabel: product.stateShareLabel,
    whyMonitor: product.whyMonitor,
  }
}

async function createQuote(product: StateMarketProduct, region: string, stateName: string): Promise<MarketQuote> {
  const template = cropTemplates[product.crop] ?? { unit: '/unidade', base: 100 }
  const providerQuote = await marketPriceService.getQuote(product.crop)
  const baseQuote = createReferenceQuote(product, region, stateName)

  if (!providerQuote) return baseQuote

  return {
    ...baseQuote,
    ...providerQuote,
    basisLabel: product.stateShareLabel ?? providerQuote.quoteType ?? 'referência regional',
    category: product.category,
    crop: product.crop,
    id: normalizeCrop(product.crop),
    priority: product.priority,
    region,
    relevanceLabel: product.relevanceLabel,
    stateShareLabel: product.stateShareLabel,
    unit: providerQuote.unit ?? template.unit,
    volumeLabel: product.category,
    whyMonitor: product.whyMonitor,
    statusLabel: providerQuote.statusLabel ?? quoteStatusLabel(providerQuote as MarketQuote),
    freshnessLabel: providerQuote.freshnessLabel ?? 'Atualizada pela fonte conectada',
  }
}

function mergeProducts(profileProducts: StateMarketProduct[], userCrops: string[]) {
  const products = [...profileProducts]
  const seen = new Set(products.map((product) => normalizeCrop(product.crop)))

  userCrops.forEach((crop) => {
    const key = normalizeCrop(crop)
    if (!seen.has(key)) {
      products.push(productFromCrop(crop, products.length + 1))
      seen.add(key)
    }
  })

  return products.sort((a, b) => a.priority - b.priority)
}

function readUserQuotes(state: string) {
  const stored = localStorage.getItem(storageKey(state))
  return stored ? (JSON.parse(stored) as MarketQuote[]) : []
}

function writeUserQuotes(state: string, quotes: MarketQuote[]) {
  localStorage.setItem(storageKey(state), JSON.stringify(quotes))
}

export const marketService = {
  resolveState(state?: string | null) {
    return normalizeState(state)
  },

  getStateProfile(state?: string | null) {
    const normalizedState = normalizeState(state)
    if (normalizedState === 'BR') return brazilProfile
    return stateProfiles[normalizedState] ?? fallbackByState[normalizedState] ?? buildStateFallbackProfile(normalizedState)
  },

  officialSources() {
    return officialMarketSources
  },

  sourceTypeLabel(sourceType?: MarketSourceType) {
    return labelForSourceType(sourceType)
  },

  fallbackLevelLabel(fallbackLevel?: MarketFallbackLevel) {
    return labelForFallbackLevel(fallbackLevel)
  },

  quoteStatusLabel(quote: MarketQuote) {
    return quoteStatusLabel(quote)
  },

  quoteTypeLabel(quote: MarketQuote) {
    return quoteTypeLabel(quote)
  },

  quoteFallbackLabel(quote: MarketQuote) {
    return quoteFallbackLabel(quote)
  },

  quoteTrendLabel(quote: MarketQuote) {
    return quoteTrendLabel(quote)
  },

  selectFeaturedQuote(quotes: MarketQuote[], userCrops: string[] = []) {
    return selectFeaturedQuote(quotes, userCrops)
  },

  async inferStateFromMunicipality(municipality?: string | null) {
    if (!municipality) return 'BR'
    const stateMap = await loadMunicipalityStateMap()
    return stateMap[normalizeLookup(municipality)] ?? 'BR'
  },

  async listQuotes(userCrops: string[] = [], region = 'Brasil', state?: string | null) {
    await new Promise((resolve) => window.setTimeout(resolve, 180))
    const profile = this.getStateProfile(state)
    const userQuotes = readUserQuotes(profile.state)
    const storedCrops = userQuotes.map((quote) => quote.crop)
    const products = mergeProducts(profile.products, [...userCrops, ...storedCrops])
    const merged = await Promise.all(products.map((product) => createQuote(product, region, profile.stateName)))

    return merged.sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99))
  },

  async addQuote(crop: string, region: string, state?: string | null, userCrops: string[] = []) {
    const profile = this.getStateProfile(state)
    const product = productFromCrop(crop, 90)
    const nextQuote = await createQuote(product, region, profile.stateName)
    const userQuotes = readUserQuotes(profile.state)
    const nextUserQuotes = [...userQuotes.filter((quote) => quote.id !== nextQuote.id), nextQuote]
    writeUserQuotes(profile.state, nextUserQuotes)
    return this.listQuotes(userCrops, region, profile.state)
  },

  availableCrops() {
    const profileCrops = Object.values(stateProfiles).flatMap((profile) => profile.products.map((product) => product.crop))
    const demoCrops = demoQuotes.map((quote) => quote.crop)
    return Array.from(new Set([...Object.keys(cropTemplates), ...profileCrops, ...demoCrops])).sort((a, b) => a.localeCompare(b, 'pt-BR'))
  },

  productionTypesForState(state?: string | null) {
    const normalizedState = normalizeState(state)
    const stateTypes = stateProductionTypes[normalizedState]
    if (stateTypes) return stateTypes

    const profileTypes = this.getStateProfile(normalizedState).products.flatMap((product) =>
      normalizeCrop(product.crop) === 'cafe' ? ['Café Arábica', 'Café Conilon'] : [product.crop],
    )

    return Array.from(new Set(profileTypes))
  },
}
