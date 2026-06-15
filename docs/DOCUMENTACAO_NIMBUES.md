# Documentação Técnica do NimbuES

Documentação gerada a partir da estrutura atual do repositório `Nimbo`.

O NimbuES é uma PWA React/TypeScript para apoio à decisão agrícola no Espírito Santo. O app combina cadastro de fazenda e áreas de cultivo, previsão climática, radar, alertas, mercado agrícola, feedback local e páginas de privacidade/transparência.

## Sumário

- [Visão geral](#visão-geral)
- [Stack e dependências](#stack-e-dependências)
- [Comandos](#comandos)
- [Fluxo de inicialização](#fluxo-de-inicialização)
- [Organização de diretórios](#organização-de-diretórios)
- [Rotas e telas](#rotas-e-telas)
- [Layout e navegação](#layout-e-navegação)
- [Contexts e estado global](#contexts-e-estado-global)
- [Tipos principais](#tipos-principais)
- [Serviços do frontend](#serviços-do-frontend)
- [Módulo de clima](#módulo-de-clima)
- [Mercado agrícola](#mercado-agrícola)
- [Backend Firebase Functions](#backend-firebase-functions)
- [Firebase, Firestore e dados locais](#firebase-firestore-e-dados-locais)
- [PWA e assets públicos](#pwa-e-assets-públicos)
- [Componentes compartilhados](#componentes-compartilhados)
- [Estilos e responsividade](#estilos-e-responsividade)
- [Testes](#testes)
- [Guia rápido de manutenção](#guia-rápido-de-manutenção)

## Visão geral

O app tem quatro blocos principais:

1. Área pública:
   Landing page, login, onboarding e cadastro inicial da fazenda.

2. Área interna:
   Dashboard, radar, áreas/talhões, alertas, mercado, feedback, conta e páginas legais/transparência.

3. Camada de dados:
   Services que conversam com Firebase, APIs públicas, cache local, IndexedDB e fallbacks demo.

4. Backend protegido:
   Cloud Function `api` para consultar Cemaden com autenticação Firebase e esconder a chamada do frontend.

O fluxo central é:

```text
main.tsx
  App.tsx
    BrowserRouter
      AuthProvider
        AppDataProvider
          AppRoutes
            páginas públicas
            AppShell
              sidebar desktop
              header/bottom-nav mobile
              Outlet
              NimboFooter
```

## Stack e dependências

### Frontend

- React 19
- TypeScript 6
- Vite 8
- React Router 7
- Firebase client SDK
- Leaflet e React Leaflet para mapas
- Lucide React para ícones
- CSS global em `src/styles/global.css`

### Backend

- Firebase Functions v2
- Firebase Admin
- Node test runner para testes do backend

### Testes e qualidade

- Vitest no frontend
- ESLint 10
- `node --test` no backend/functions

## Comandos

Arquivo: `package.json`

```bash
npm install
npm run dev
npm run dev:web
npm run dev:api
npm run build
npm run lint
npm test
npm run test:backend
```

Descrição:

- `npm run dev`: sobe frontend Vite e emulador de Functions juntos.
- `npm run dev:web`: sobe apenas Vite.
- `npm run dev:api`: sobe Firebase emulators apenas para functions.
- `npm run build`: compila TypeScript e gera build Vite.
- `npm run lint`: roda ESLint.
- `npm test`: roda Vitest e testes do backend.
- `npm run test:backend`: roda somente testes em `functions/test`.

## Fluxo de inicialização

### `src/main.tsx`

Ponto de entrada React. Importa:

- `leaflet/dist/leaflet.css`
- `src/index.css`
- `App`

Monta o app em `#root` dentro de `StrictMode`.

### `src/App.tsx`

Define a composição de providers:

```tsx
<BrowserRouter>
  <AuthProvider>
    <AppDataProvider>
      <AppRoutes />
    </AppDataProvider>
  </AuthProvider>
</BrowserRouter>
```

Tudo que depende de autenticação, fazenda, clima, alertas, localização e feedback fica disponível a partir desses providers.

## Organização de diretórios

```text
.
├── public/
│   ├── assets/
│   ├── favicon.svg
│   ├── icons.svg
│   ├── manifest.webmanifest
│   └── sw.js
├── functions/
│   ├── index.js
│   ├── package.json
│   ├── src/
│   │   └── cemaden.js
│   └── test/
│       └── cemaden.backend.js
├── src/
│   ├── components/
│   ├── config/
│   ├── contexts/
│   ├── hooks/
│   ├── lib/
│   ├── modules/
│   ├── pages/
│   ├── routes/
│   ├── services/
│   ├── styles/
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── .env.example
├── firebase.json
├── firestore.indexes.json
├── firestore.rules
├── package.json
├── README.md
├── tsconfig*.json
└── vite.config.ts
```

### `public/`

Arquivos servidos diretamente pelo Vite/Hosting.

- `assets/hero-fields.jpg`: imagem principal da landing.
- `assets/nimbo-mark.svg`: marca usada no app.
- `assets/nimbo-mark.jpg`: variação raster da marca.
- `assets/radar-cloudscape-nimbo.png`: imagem relacionada ao radar/clima.
- `manifest.webmanifest`: manifesto PWA.
- `sw.js`: service worker.
- `favicon.svg` e `icons.svg`: ícones públicos.

### `functions/`

Backend Firebase Functions.

- `index.js`: expõe a Cloud Function HTTP `api`.
- `src/cemaden.js`: parser e normalizador do payload Cemaden.
- `test/cemaden.backend.js`: testes de parser, distância e escolha do pluviômetro.

### `src/components/`

Componentes reutilizáveis e componentes de layout.

Pastas importantes:

- `components/radar/`: componentes específicos da tela de radar.
- `components/footer/`: footer central do app.

Arquivos importantes:

- `AppShell.tsx`: layout interno com menu lateral, conteúdo e bottom nav mobile.
- `Brand.tsx`: marca compacta e logo completo.
- `Button.tsx`: botões e links com estilo de botão.
- `Surface.tsx`: `Card`, `EmptyState`, `SkeletonGrid`, `OfflineBanner`.
- `FormField.tsx`: campos de formulário.
- `Charts.tsx`: gráficos simples de mercado, ET0 e chuva.
- `PublicHeader.tsx`: header da landing pública.
- `PageHeader.tsx`: cabeçalho padrão de páginas internas.

### `src/config/`

Configurações de marca e links.

- `brand.ts`: nome, slogan, versão e estado principal do app.
- `footerLinks.ts`: seções e links do footer.

Valores atuais:

```ts
APP_NAME = 'NimbuES'
APP_SLOGAN = 'Inteligência climática para proteger sua safra'
APP_VERSION = '1.0.0'
APP_STATE = 'ES'
APP_STATE_NAME = 'Espírito Santo'
```

### `src/contexts/`

Contexts globais.

- `AuthContext.tsx`: autenticação e navegação pós-login.
- `authContextValue.ts`: tipo e contexto de autenticação.
- `AppDataContext.tsx`: dados de fazenda, talhões, clima, alertas, localização, feedback e preferências.
- `appDataContextValue.ts`: tipo e contexto dos dados globais.

### `src/hooks/`

Hooks auxiliares.

- `useAuth.ts`: acesso ao `AuthContext`.
- `useAppData.ts`: acesso ao `AppDataContext`.
- `useOnlineStatus.ts`: status online/offline.
- `usePersistentState.ts`: estado sincronizado com `localStorage`.
- `useRadarWeather.ts`: carrega e combina dados específicos para a tela de radar.

### `src/lib/`

Bibliotecas e dados base.

- `firebase.ts`: inicialização condicional do Firebase.
- `mockData.ts`: dados demo de usuário, fazenda, talhões, clima, recomendações, alertas, cotações e preferências.

### `src/modules/weather/`

Módulo climático novo/estruturado.

```text
modules/weather/
├── index.ts
├── types/
├── providers/
└── services/
```

Responsabilidades:

- Normalizar provedores climáticos.
- Resolver localização por talhão/fazenda/usuário.
- Gerenciar cache local/remoto.
- Calcular confiança operacional.
- Separar fonte operacional, validação e visual.

### `src/pages/`

Telas roteáveis do app.

Cada arquivo exporta uma página usada por `AppRoutes`.

### `src/routes/`

- `AppRoutes.tsx`: mapa central de rotas públicas, internas, redirecionamentos e páginas legais.

### `src/services/`

Services de domínio e integração.

Inclui autenticação, fazendas, talhões, clima, mercado, radar, satélite, localização, feedback e recomendações.

### `src/styles/`

- `global.css`: estilo principal do app.

### `src/types/`

- `index.ts`: tipos de domínio do app.
- `weather.ts`: tipos específicos de visualização do radar/clima.

### `src/utils/`

- `firestoreData.ts`: helpers para serializar dados no Firestore sem `undefined`.
- `locationText.ts`: helpers de texto/localização.

## Rotas e telas

Arquivo central: `src/routes/AppRoutes.tsx`

### Rotas públicas

| Rota | Tela | Arquivo | Função |
|---|---|---|---|
| `/` | Landing | `src/pages/LandingPage.tsx` | Apresentação pública do produto, proposta de valor e CTA. |
| `/login` | Login | `src/pages/LoginPage.tsx` | Entrada por Google, senha, cadastro e link por e-mail. No mobile começa com tela de vídeo/CTA. |
| `/onboarding` | Onboarding | `src/pages/OnboardingPage.tsx` | Explica o passo inicial antes de cadastrar fazenda. |
| `/fazenda/nova` | Nova fazenda | `src/pages/NewFarmPage.tsx` | Cadastro de fazenda, localidade no ES e ajuste do pino no mapa. |

### Rotas internas principais

Todas passam por `AppShell`.

| Rota | Tela | Arquivo | Função |
|---|---|---|---|
| `/dashboard` | Início | `src/pages/DashboardPage.tsx` | Resumo do dia: clima, alertas, recomendações, radar, mercado e áreas. |
| `/talhoes` | Áreas | `src/pages/FieldsPage.tsx` | Lista de talhões/áreas, risco climático e linha de mercado por cultura. |
| `/talhoes/novo` | Novo talhão | `src/pages/NewFieldPage.tsx` | Cadastro de área/cultura/estágio/sensibilidade. |
| `/talhoes/:fieldId` | Detalhe do talhão | `src/pages/FieldDetailPage.tsx` | Detalhes de uma área específica. |
| `/alertas` | Alertas | `src/pages/AlertsPage.tsx` | Lista e filtros por severidade, silenciar e arquivar alertas. |
| `/mapa` | Radar | `src/pages/RadarPage.tsx` | Radar, mapa climático, camadas, satélite, resumo e decisões operacionais. |
| `/mercado` | Mercado | `src/pages/MarketPage.tsx` | Preços, fontes, histórico, comparação, qualidade de dado e culturas monitoradas. |
| `/feedback` | Feedback | `src/pages/FeedbackPage.tsx` | Registro de chuva/geada/acerto da previsão e utilidade da recomendação. |
| `/conta` | Conta | `src/pages/AccountPage.tsx` | Perfil, fazenda, áreas, preferências e configurações. |

### Redirecionamentos

| Rota | Destino |
|---|---|
| `/app` | `/dashboard` |
| `/home` | `/dashboard` |
| `/account` | `/conta` |
| `/profile` | `/conta` |
| `/radar` | `/mapa` |
| `/alerts` | `/alertas` |
| `/market` | `/mercado` |

### Rotas legais, suporte e transparência

Todas usam `FooterInfoPage`.

| Rota | Página |
|---|---|
| `/privacy` | Política de Privacidade |
| `/cookies` | Cookies e dados locais |
| `/permissions` | Permissões do app |
| `/consents` | Gerenciar consentimentos |
| `/data-sources` | Fontes de dados |
| `/alerts-methodology` | Como calculamos alertas |
| `/api-status` | Status das APIs |
| `/forecast-limitations` | Limitações das previsões |
| `/farms` | Minhas fazendas |
| `/crops` | Culturas cadastradas |
| `/alert-preferences` | Preferências de alerta |
| `/help` | Central de ajuda |
| `/report-problem` | Reportar erro |
| `/contact` | Contato |
| `/about` | Sobre o NimbuES |
| `/terms` | Termos de uso |
| `/delete-account` | Excluir minha conta |

### Not found

| Rota | Tela |
|---|---|
| `*` | `NotFoundPage` |

## Layout e navegação

### `AppShell`

Arquivo: `src/components/AppShell.tsx`

Responsável pelo layout interno.

Desktop:

- Menu lateral fixo com:
  - Início
  - Radar
  - Áreas
  - Mercado
  - Alertas
- Perfil no rodapé lateral.
- Conteúdo em `<Outlet />`.
- Footer completo abaixo do conteúdo.

Mobile:

- Header compacto com logo e avatar.
- Bottom nav com:
  - Início
  - Radar
  - Mercado
  - Alertas
  - Perfil
- Sidebar escondida.

### `NimboFooter`

Arquivo: `src/components/footer/NimboFooter.tsx`

Variantes:

- `full`: footer interno com marca, confiança, localização, seções, fontes e versão.
- `public`: footer para telas públicas.
- `minimal`: versão reduzida.

Seções do footer:

- Privacidade e segurança
- Dados e fontes
- Conta e fazenda
- Suporte
- Informações do app

## Contexts e estado global

### `AuthProvider`

Arquivo: `src/contexts/AuthContext.tsx`

Responsabilidades:

- Manter usuário autenticado.
- Usar `authService` para login/cadastro/logout.
- Persistir usuário em `localStorage` via `usePersistentState`.
- Completar login por link de e-mail.
- Navegar para `/dashboard` ou `/onboarding` conforme a ação.

Métodos expostos pelo contexto:

- `signInWithGoogle`
- `signInWithPassword`
- `signUpWithPassword`
- `signInWithEmail`
- `signOut`

### `AppDataProvider`

Arquivo: `src/contexts/AppDataContext.tsx`

Estado global:

- `farm`: fazenda atual.
- `fields`: áreas/talhões.
- `alerts`: alertas ativos.
- `climate`: dashboard climático consolidado.
- `settings`: preferências do usuário.
- `feedbackQueue`: feedbacks locais/sincronizados.
- `climateLoading`: carregamento do clima.
- `isOnline`: status de rede.
- `staleData`: dados considerados desatualizados.
- `userLocation`: localização do usuário/navegador/rede/fazenda.
- `locationStatus`: estado da geolocalização.
- `locationError`: mensagem de erro de localização.
- `activeFieldId`: talhão selecionado para clima/radar.
- `weatherLocation`: alvo climático resolvido.

Operações expostas:

- `setActiveFieldId`
- `saveFarm`
- `addField`
- `deleteFarm`
- `deleteField`
- `requestUserLocation`
- `muteAlert`
- `archiveAlert`
- `saveFeedback`
- `refreshClimate`
- `updateSettings`

Fluxo de dados:

1. Carrega fazendas do `farmService`.
2. Carrega talhões da fazenda selecionada via `fieldService`.
3. Resolve localização climática com `resolveWeatherLocation`.
4. Consulta `climateService.getDashboard`.
5. Atualiza clima, alertas, status de atualização e stale data.
6. Carrega feedbacks IndexedDB.
7. Se online, marca feedbacks enfileirados como sincronizados.

## Tipos principais

Arquivo: `src/types/index.ts`

### `UserProfile`

Perfil do usuário:

- `id`
- `name`
- `email`
- `initials`
- `farmName`

### `Farm`

Fazenda:

- `id`
- `name`
- `locality`
- `municipality`
- `state`
- `locationLabel`
- `productionType`
- `areaHa`
- `timezone`
- `coordinates`
- `notes`

### `Field`

Área/talhão:

- `id`
- `name`
- `crop`
- `areaHa`
- `stage`
- `soilType`
- `irrigation`
- `climateStatus`
- `currentRecommendation`
- `riskLevel`
- `rainGaugeMm`
- `sensitivities`
- `coordinates`

### `ForecastHour`

Hora de previsão:

- temperatura
- umidade
- precipitação
- probabilidade de precipitação
- vento
- rajada
- direção do vento
- ET0
- código meteorológico

### `WeatherSnapshot`

Resumo climático usado em cards e decisões.

### `Recommendation`

Recomendação explicável:

- tipo: irrigação, pulverização, clima ou mercado.
- título, descrição e ação.
- justificativa.
- confiança.
- fontes.
- severidade.
- talhão relacionado.

### `Alert`

Alerta climático/operacional:

- geada
- chuva severa
- vento forte
- baixa umidade
- risco de incêndio
- excesso de chuva
- estiagem
- pulverização

### `MarketQuote`

Cotação de mercado:

- cultura
- região
- preço
- unidade
- variação
- tendência
- histórico
- fonte
- qualidade de dado
- status
- tipo de fonte
- nível de fallback

### `Feedback`

Feedback do produtor:

- campo/talhão.
- choveu ou não.
- volume em mm.
- geada.
- previsão acertou.
- recomendação foi útil.
- notas.
- status `queued` ou `synced`.

### `UserSettings`

Preferências:

- sistema métrico.
- formato 24h.
- notificações.
- modo offline.
- alertas severos.
- resumo diário.
- preços de referência.
- watchlist de mercado.
- atualização automática de localização.
- economia de dados.

## Serviços do frontend

### `authService`

Arquivo: `src/services/authService.ts`

Responsável por autenticação.

Métodos:

- `signInWithGoogle()`
- `signInWithPassword(email, password)`
- `signUpWithPassword(email, password, name)`
- `sendEmailLink(email)`
- `isEmailLink(url)`
- `completeEmailLink(url)`
- `signOut()`
- `onAuthChange(callback)`

Comportamento:

- Usa Firebase Auth quando configurado.
- Sem Firebase, usa `demoUser`.
- Salva perfil em `users/{userId}` no Firestore quando possível.

### `farmService`

Arquivo: `src/services/farmService.ts`

Responsável por fazendas.

Métodos:

- `listFarms(userId)`
- `saveFarm(userId, farm)`
- `deleteFarm(userId, farmId)`

Persistência:

- Local: `localStorage`.
- Remota: `users/{userId}/farms/{farmId}`.

### `fieldService`

Arquivo: `src/services/fieldService.ts`

Responsável por talhões/áreas.

Métodos:

- `listFields(userId, farmId)`
- `saveField(userId, farmId, field)`
- `deleteField(userId, farmId, fieldId)`
- `clearFarmFields(userId, farmId)`

Persistência:

- Local: `localStorage`.
- Remota: `users/{userId}/farms/{farmId}/fields/{fieldId}`.

### `feedbackService`

Arquivo: `src/services/feedbackService.ts`

Responsável pela fila offline de feedback.

Métodos:

- `saveFeedback(userId, feedback)`
- `listQueue()`
- `markQueuedAsSynced()`

Persistência:

- IndexedDB local em `nimbo-feedback`.
- Firestore em `users/{userId}/feedbacks` quando online.

### `locationService`

Arquivo: `src/services/locationService.ts`

Responsável por localização.

Métodos:

- `isSupported()`
- `getCurrentPosition()`
- `watchPosition(onChange, onError)`

Fontes:

- Geolocation do navegador.
- Fallback por rede:
  - GeoJS
  - ipwhois.app
  - Geolocation DB

Status possíveis:

- `idle`
- `requesting`
- `tracking`
- `denied`
- `unavailable`
- `timeout`
- `error`

### `climateService`

Arquivo: `src/services/climateService.ts`

Responsável por consolidar clima, previsão, alertas e confiança.

Método principal:

- `getDashboard(fields, farm, userLocation, options)`

O método:

1. Escolhe melhores coordenadas.
2. Busca previsão Open-Meteo via `weatherGateway`.
3. Busca estação oficial INMET.
4. Busca previsão brasileira CPTEC/BrasilAPI.
5. Busca pluviômetro Cemaden.
6. Monta `WeatherSnapshot`.
7. Gera alertas de previsão.
8. Calcula confiança via `calculateWeatherConfidence`.
9. Retorna `ClimateDashboard`.

### `recommendationEngine`

Arquivo: `src/services/recommendationEngine.ts`

Função:

- `generateRecommendations(fields, weather)`

Gera recomendações explicáveis para irrigação/pulverização/clima usando dados do talhão e snapshot climático.

### `marketService`

Arquivo: `src/services/marketService.ts`

Responsável pela camada de mercado agrícola.

Métodos:

- `resolveState(state)`
- `getStateProfile(state)`
- `officialSources()`
- `sourceTypeLabel(sourceType)`
- `fallbackLevelLabel(fallbackLevel)`
- `quoteStatusLabel(quote)`
- `quoteTypeLabel(quote)`
- `quoteFallbackLabel(quote)`
- `quoteTrendLabel(quote)`
- `selectFeaturedQuote(quotes, userCrops)`
- `inferStateFromMunicipality(municipality)`
- `listQuotes(userCrops, region, state)`
- `addQuote(crop, region, state, userCrops)`
- `availableCrops()`
- `productionTypesForState(state)`

Persistência:

- Cotações adicionadas pelo usuário em `localStorage`.

### `marketPriceService`

Arquivo: `src/services/marketPriceService.ts`

Método:

- `getQuote(crop)`

Busca cotações específicas, com foco atual em:

- Café
- Redação Agro

### `radarService`

Arquivo: `src/services/radarService.ts`

Responsável por metadados e tiles RainViewer.

Métodos:

- `getRadarMetadata()`
- `tileUrl(metadata, frame)`

Constantes:

- `RAINVIEWER_MAX_NATIVE_ZOOM`
- `RAINVIEWER_REFRESH_INTERVAL`

### `satelliteService`

Arquivo: `src/services/satelliteService.ts`

Responsável por camada NASA GIBS.

Método:

- `getLayerInfo(date)`

Constante:

- `GIBS_SATELLITE_MAX_NATIVE_ZOOM`

### `weatherZoneService`

Arquivo: `src/services/weatherZoneService.ts`

Responsável por zonas meteorológicas usadas em mapas.

Métodos:

- `getZones(coordinates, period, options)`
- `getNationalZones(period, options)`

Constante:

- `WEATHER_ZONE_REFRESH_INTERVAL`

### `placeSearchService`

Arquivo: `src/services/placeSearchService.ts`

Responsável por localidades brasileiras, principalmente Espírito Santo.

Exporta:

- `brazilStates`
- `placeKindLabel(kind)`
- `placeSearchService`

Usado no cadastro da fazenda para buscar município/distrito/subdistrito e coordenadas.

### `inmetService`

Arquivo: `src/services/inmetService.ts`

Responsável por observações oficiais do INMET.

Exporta:

- `parseInmetNumber`
- `mapInmetObservation`
- `inmetService.getNearestObservation(farm)`

### `weather/mapper` e cache de radar

Arquivos:

- `src/services/weather/weatherMapper.ts`
- `src/services/weather/weatherCache.ts`

Responsabilidades:

- Transformar `ClimateDashboard` em dados próprios da tela de radar.
- Cache local do radar climático por fazenda.

## Módulo de clima

Diretório: `src/modules/weather`

### Providers

Diretório: `src/modules/weather/providers`

- `openMeteoProvider.ts`: previsão horária global.
- `inmetProvider.ts`: observação oficial INMET.
- `cptecProvider.ts`: previsão CPTEC/BrasilAPI.
- `cemadenProvider.ts`: pluviômetro Cemaden.
- `rainViewerProvider.ts`: metadados visuais de radar.
- `types.ts`: contrato comum dos providers.

### Services

Diretório: `src/modules/weather/services`

- `weatherGateway.ts`: fachada única para providers + cache.
- `weatherCacheService.ts`: cache local e Firestore para dados climáticos.
- `weatherConfidenceService.ts`: cálculo de confiança por variável.
- `weatherLocationService.ts`: escolha do alvo climático.

### `weatherGateway`

Métodos:

- `getForecastByLocation(coordinates, options)`
- `getNearestOfficialObservation(farm, options)`
- `getBrazilianForecast(farm, options)`
- `getNearestRainGauge(farm, options)`
- `getVisualRadarMetadata(options)`
- `getProviderStatuses()`

### `weatherLocationService`

Função:

- `resolveWeatherLocation({ activeFieldId, farm, fields, userLocation })`

Prioridade:

1. Coordenada própria do talhão ativo.
2. Centro da fazenda quando o talhão não tem GPS.
3. Coordenada da fazenda.
4. Localização do usuário quando não há fazenda.
5. `null` quando não há coordenada suficiente.

### `weatherConfidenceService`

Função:

- `calculateWeatherConfidence(input)`

Cruza fontes operacionais e de validação.

Observação importante:

- RainViewer e NASA GIBS são visuais e não elevam confiança operacional.

## Mercado agrícola

Tela: `src/pages/MarketPage.tsx`

Service principal: `src/services/marketService.ts`

Objetivo:

- Mostrar preços e referências agrícolas priorizadas para o Espírito Santo.
- Separar dado real, referência e indisponibilidade.
- Evitar misturar preço ao produtor, atacado e estimativa interna sem identificação.

Recursos da tela:

- Filtros:
  - Todos
  - Café
  - Frutas
  - Hortaliças
  - Grãos
  - Minhas culturas
- Períodos:
  - Semanal
  - Mensal
  - Anual
- Painel de detalhe por cultura:
  - Resumo
  - Histórico
  - Comparar
  - Fontes
  - Avançado
- Comparação:
  - Preço
  - Índice de tendência

Tipos importantes:

- `MarketQuote`
- `MarketPeriod`
- `MarketTrend`
- `MarketSourceType`
- `MarketFallbackLevel`
- `StateMarketProfile`
- `StateMarketProduct`

## Backend Firebase Functions

Diretório: `functions/`

### Cloud Function `api`

Arquivo: `functions/index.js`

Rota suportada:

```text
GET /api/weather/cemaden
```

Características:

- Região: `southamerica-east1`.
- Exige Firebase ID token no header `Authorization: Bearer <token>`.
- Faz CORS para origens permitidas.
- Busca payload Cemaden.
- Mantém cache em memória por 10 minutos.
- Retorna o pluviômetro mais próximo.
- Responde `401` sem autenticação.
- Responde `404` para rotas não suportadas.
- Responde `502` quando o Cemaden está indisponível.

Variáveis de ambiente da Function:

- `CEMADEN_SOURCE_URL`
- `CEMADEN_MAX_DISTANCE_KM`

### Parser Cemaden

Arquivo: `functions/src/cemaden.js`

Funções:

- `parseCemadenPayload(payload)`
- `parseObservedAt(value)`
- `distanceKm(fromLatitude, fromLongitude, toLatitude, toLongitude)`
- `findNearestRainGauge(payload, query, maxDistanceKm)`

Retorno normalizado:

- código da estação.
- nome da estação.
- cidade/UF.
- coordenadas.
- horário observado.
- distância.
- acumulado 24h.
- qualificação.
- URL da fonte.

## Firebase, Firestore e dados locais

### Configuração Firebase

Arquivo: `src/lib/firebase.ts`

Variáveis em `.env.example`:

```text
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=nimboradar.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=nimboradar
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIRESTORE_DATABASE_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_NIBUSES_API_URL=/api
```

Observação:

- `VITE_NIBUSES_API_URL` é o nome legado da variável de API, ainda usado por compatibilidade.

### Firestore

Estruturas usadas:

```text
users/{userId}
users/{userId}/farms/{farmId}
users/{userId}/farms/{farmId}/fields/{fieldId}
users/{userId}/feedbacks/{feedbackId}
users/{userId}/weather_cache/{cacheId}
```

### Dados locais

`localStorage`:

- usuário autenticado/cache: `nimbo:user`
- preferências: `nimbo:settings`
- fazenda: `nimbo:{userId}:farm`
- áreas: `nimbo:{userId}:{farmId}:fields`
- localizações de rede: `nimbo:network-location:v1`
- cotações adicionadas pelo usuário em mercado.

IndexedDB:

- banco `nimbo-feedback`
- store `feedbacks`

## PWA e assets públicos

### Manifest

Arquivo: `public/manifest.webmanifest`

Define metadados PWA, ícones e comportamento de instalação.

### Service worker

Arquivo: `public/sw.js`

Responsável por cache/offline básico.

### Imagens

Diretório: `public/assets/`

- `hero-fields.jpg`: hero da landing.
- `nimbo-mark.svg`: marca do NimbuES.
- `nimbo-mark.jpg`: variação raster.
- `radar-cloudscape-nimbo.png`: imagem climática/radar.

## Componentes compartilhados

### Marca

Arquivo: `src/components/Brand.tsx`

- `Brand`: link com ícone e nome do app.
- `FullLogo`: logo completo com slogan.

### Botões

Arquivo: `src/components/Button.tsx`

- `Button`: botão HTML com variantes.
- `LinkButton`: `Link` do React Router com aparência de botão.

Variantes:

- `primary`
- `secondary`
- `ghost`
- `danger`

Tamanhos:

- `sm`
- `md`
- `lg`

### Badges

Arquivo: `src/components/Badge.tsx`

Usado para status, tags e informações curtas.

### Superfícies

Arquivo: `src/components/Surface.tsx`

- `Card`
- `EmptyState`
- `SkeletonGrid`
- `OfflineBanner`

### Formulários

Arquivo: `src/components/FormField.tsx`

- `TextField`
- `SelectField`
- `TextAreaField`

### Gráficos

Arquivo: `src/components/Charts.tsx`

- `Sparkline`
- `MarketChart`
- `Et0Bars`
- `RainTimeline`

### Componentes de radar

Diretório: `src/components/radar/`

- `RadarHeader`
- `RadarViewSwitcher`
- `RadarEmptyState`
- `WeatherMapLayer`
- `WeatherLegend`
- `WeatherIconLayer`
- `TvWeatherMap`
- `QuickWeatherData`
- `WeatherMetricCard`
- `WeatherSummaryCard`
- `FarmLocationMarker`

## Estilos e responsividade

Arquivo principal: `src/styles/global.css`

### Layout interno

Desktop:

- `.app-shell` em grid com `var(--sidebar-width)` e conteúdo.
- `.app-sidebar` fixa/sticky com altura `100svh`.
- `.app-content` com largura máxima e footer interno.

Mobile:

- Sidebar escondida abaixo de `820px`.
- `.mobile-app-header` visível.
- `.bottom-nav` fixa no rodapé com 5 itens.

### Login mobile

No mobile, a tela de login começa com:

- logo grande.
- card de vídeo/play.
- botão `COMEÇAR`.

Após o clique, aparece o formulário de login normal.

Classes principais:

- `.mobile-intro-pending`
- `.mobile-login-intro`
- `.mobile-login-logo`
- `.mobile-login-video`
- `.mobile-login-play`
- `.mobile-login-start`

### Footer

Classes principais:

- `.nimbo-footer`
- `.nimbo-footer.full`
- `.nimbo-footer.public`
- `.nimbo-footer.minimal`
- `.footer-location-card`
- `.footer-trust-card`
- `.footer-section`
- `.footer-data-strip`

### Mercado

Classes principais:

- `.market-layered-page`
- `.market-layered-header`
- `.market-filter-row`
- `.market-today-grid`
- `.market-detail-panel`
- `.market-tab-list`
- `.market-index-list`

### Radar

A tela de radar usa Leaflet, camadas customizadas, controles próprios e responsividade dedicada em `global.css`.

## Testes

### Frontend

Rodados com Vitest.

Arquivos atuais:

- `src/services/weather/weatherMapper.test.ts`
- `src/services/recommendationEngine.test.ts`
- `src/services/marketService.test.ts`
- `src/services/inmetService.test.ts`
- `src/modules/weather/services/weatherLocationService.test.ts`
- `src/modules/weather/services/weatherConfidenceService.test.ts`
- `src/modules/weather/services/weatherCacheService.test.ts`

### Backend

Rodados com Node test runner.

Arquivo:

- `functions/test/cemaden.backend.js`

## Guia rápido de manutenção

### Alterar nome, slogan ou estado principal

Arquivo:

- `src/config/brand.ts`

### Adicionar nova rota

Arquivo:

- `src/routes/AppRoutes.tsx`

Passos:

1. Criar página em `src/pages`.
2. Importar em `AppRoutes`.
3. Definir `<Route>`.
4. Se for página interna, colocar dentro do `<Route element={<AppShell />}>`.

### Adicionar item no menu lateral

Arquivo:

- `src/components/AppShell.tsx`

Editar:

- `sideNavItems`

### Adicionar item no bottom nav mobile

Arquivo:

- `src/components/AppShell.tsx`

Editar:

- `bottomNavItems`

Observação:

- A bottom nav deve continuar com poucos itens para caber no celular.

### Alterar links do footer

Arquivo:

- `src/config/footerLinks.ts`

Editar:

- `footerLinkSections`
- `publicFooterLinks`

### Criar nova página legal/transparência

Arquivo:

- `src/pages/FooterInfoPage.tsx`

Passos:

1. Adicionar chave em `InfoPageKey`.
2. Adicionar conteúdo em `infoPages`.
3. Criar rota em `AppRoutes`.
4. Adicionar link em `footerLinks.ts`, se necessário.

### Mudar cadastro de fazenda

Arquivo:

- `src/pages/NewFarmPage.tsx`

Services relacionados:

- `placeSearchService`
- `farmService`
- `locationService`

### Mudar cadastro de talhão

Arquivo:

- `src/pages/NewFieldPage.tsx`

Services relacionados:

- `fieldService`
- `AppDataContext.addField`

### Mudar regras de recomendação

Arquivo:

- `src/services/recommendationEngine.ts`

Testes relacionados:

- `src/services/recommendationEngine.test.ts`

### Mudar regras de alerta climático

Arquivo principal:

- `src/services/climateService.ts`

Pontos relacionados:

- `generateForecastAlerts`
- `weatherConfidenceService`
- `weatherGateway`

### Mudar fontes climáticas

Diretório:

- `src/modules/weather/providers`

Arquivos relacionados:

- `weatherGateway.ts`
- `weatherCacheService.ts`
- `weatherConfidenceService.ts`

### Mudar Mercado

Arquivos:

- `src/pages/MarketPage.tsx`
- `src/services/marketService.ts`
- `src/services/marketPriceService.ts`
- `src/types/index.ts`

### Mudar Radar

Arquivos:

- `src/pages/RadarPage.tsx`
- `src/hooks/useRadarWeather.ts`
- `src/components/radar/*`
- `src/services/radarService.ts`
- `src/services/weatherZoneService.ts`
- `src/services/weather/weatherMapper.ts`

### Mudar feedback offline

Arquivo:

- `src/services/feedbackService.ts`

Tela:

- `src/pages/FeedbackPage.tsx`

Context:

- `AppDataContext.saveFeedback`

### Mudar backend Cemaden

Arquivos:

- `functions/index.js`
- `functions/src/cemaden.js`
- `functions/test/cemaden.backend.js`

Depois rodar:

```bash
npm --prefix functions test
```

### Rodar validação completa

```bash
npm run build
npm run lint
npm test
```

## Estado atual importante

- O app usa fallback local/demo quando Firebase não está configurado.
- A área interna ainda não possui guarda obrigatória de autenticação em rota; o provider permite usuário demo/local.
- Cemaden exige autenticação Firebase quando chamado via Cloud Function real.
- RainViewer e NASA GIBS são fontes visuais e não elevam confiança operacional.
- O foco de mercado está no Espírito Santo via `APP_STATE = 'ES'`.
- O footer foi estruturado como centro de confiança, privacidade, fontes, suporte e dados legais.
- O layout desktop usa menu lateral; mobile usa header compacto e bottom nav.
