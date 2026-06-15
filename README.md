# NimbuES

PWA React/TypeScript de inteligência climática focada em propriedades rurais do Espírito Santo, inspirada diretamente no protótipo visual do Lovable:
https://nimbo-farm-weather.lovable.app

## Documentação completa

A documentação técnica detalhada do projeto está em:

- [docs/DOCUMENTACAO_NIMBUES.md](docs/DOCUMENTACAO_NIMBUES.md)

## Rotas

- `/`
- `/login`
- `/onboarding`
- `/dashboard`
- `/fazenda/nova`
- `/talhoes`
- `/talhoes/novo`
- `/talhoes/:fieldId`
- `/alertas`
- `/mapa`
- `/mercado`
- `/feedback`
- `/conta`

## Estrutura

```text
src/
  components/
  contexts/
  hooks/
  lib/
  modules/
    weather/
  pages/
  routes/
  services/
  styles/
  types/
```

## Serviços preparados

- `authService`: Firebase Authentication com Google e link de e-mail, com fallback demo local.
- `farmService`: Firestore em `users/{userId}/farms/{farmId}` com fallback local.
- `fieldService`: Firestore em `users/{userId}/farms/{farmId}/fields/{fieldId}` com fallback local.
- `climateService`: Open-Meteo em tempo real para previsão, chuva, vento e ET0, com validação complementar CPTEC/BrasilAPI, INMET e Cemaden.
- `radarService`: RainViewer para metadados e tiles de radar em mapa Leaflet.
- `modules/weather`: providers normalizados, resolução de coordenadas por fazenda/talhão, fachada única e cache híbrido local + Firestore.
- `recommendationEngine`: recomendações explicáveis com ação, justificativa, confiança, fontes e severidade.
- `feedbackService`: IndexedDB offline queue + Firestore em `users/{userId}/feedbacks`.
- `marketService`: watchlist local funcional por cultura, preparada para CONAB/CEPEA/backend.

## Rodar

```bash
npm install
npm run dev
npm run lint
npm run build
npm test
```

`npm run dev` inicia o Vite e o emulador da API protegida em conjunto. Para iniciar apenas o frontend, use `npm run dev:web`.

Para ativar Firebase real, configure as variáveis `VITE_FIREBASE_*` no ambiente.

## Cache meteorológico

No MVP, o `weatherGateway` centraliza Open-Meteo, INMET, CPTEC/BrasilAPI, Cemaden e RainViewer. Os dados são salvos primeiro no navegador para uso offline. Previsão consolidada e observações também são persistidas, para usuários autenticados, em:

```text
users/{userId}/weather_cache/{cacheId}
```

TTLs atuais:

- Radar visual: 5 minutos.
- Zonas meteorológicas: 10 minutos.
- Pluviômetro Cemaden: 20 minutos.
- Previsão horária e INMET: 60 minutos.
- Previsão diária CPTEC/BrasilAPI: 4 horas.
- Histórico: 24 horas.

O adaptador Cemaden consulta `VITE_NIBUSES_API_URL/weather/cemaden` usando o ID token do usuário Firebase. Por compatibilidade, `VITE_NIMBO_API_URL` ainda é aceito. A Cloud Function `api` consulta o arquivo nacional de acumulado de 24h publicado pelo mapa oficial, mantém cache curto no servidor e devolve o pluviômetro mais próximo já normalizado. Nenhuma credencial protegida é exposta em variável `VITE_*`.

Para publicar a integração:

```bash
firebase deploy --only functions,hosting --project nimboradar
```

O Firebase exige um projeto com faturamento habilitado para publicar Cloud Functions, mesmo quando o consumo permanece dentro das cotas sem custo.

O motor de confiança cruza Open-Meteo com INMET, CPTEC/BrasilAPI e Cemaden. RainViewer e NASA GIBS continuam estritamente visuais e não elevam a confiança operacional.

Radar e malha de zonas usam apenas cache local curto no MVP para evitar gravações Firestore repetitivas por usuário. Quando o backend próprio estiver ativo, esses dados globais devem ser cacheados uma única vez no servidor.

## Firebase e custo do backend

O app principal continua usando:

- Firebase Authentication: Google, e-mail/senha e link de e-mail.
- Firestore Database.
- Firebase Hosting.

A integração protegida com o Cemaden adiciona uma Cloud Function e exige o plano Blaze para publicação. No desenvolvimento local, `npm run dev` usa o emulador e não exige a migração do projeto.

Deploy recomendado:

```bash
npm run build
firebase deploy --only functions,hosting,firestore --project nimboradar
```

Para o login por link de e-mail funcionar em produção, confirme no Firebase Console:

- `nimboradar.web.app` em Authentication > Settings > Authorized domains.
- `localhost` ou `127.0.0.1` em Authorized domains para testes locais.
- O provedor Email/Password habilitado com a opcao de link de e-mail ativa.

O arquivo `.env.example` lista as variaveis esperadas. Copie para `.env.local` e preencha com as credenciais do app web do Firebase.

Neste projeto, o Firestore foi criado como banco nomeado `default`, entao o ambiente local usa:

```bash
VITE_FIRESTORE_DATABASE_ID=default
```

## Direitos autorais

Copyright (c) 2026 Alexandre Hackbardt Bolsoni.

Todos os direitos reservados. Este repositório é público para consulta e apresentação do projeto, mas o código, marca, design, documentação e demais materiais não podem ser copiados, modificados, redistribuídos, sublicenciados ou usados comercialmente sem autorização expressa do titular.

Veja [LICENSE](LICENSE).
