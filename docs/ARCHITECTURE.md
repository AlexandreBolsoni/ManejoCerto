# Arquitetura do NimbuES

## Fluxo esperado

```txt
Page
  -> Hook
  -> Service / Use case
  -> Gateway / Repository
  -> Provider / API / Firebase / Storage
  -> Dados tipados
```

## Responsabilidades

`Page`
: Compoe a tela e conecta componentes visuais.

`Hook`
: Prepara dados e acoes para a tela. Pode consumir contextos e services.

`Service`
: Coordena regra de aplicacao e normaliza respostas.

`Use case`
: Representa uma acao especifica de negocio quando o service ficar grande.

`Gateway`
: Integra com um sistema externo ou agrupa providers externos.

`Provider`
: Implementa uma fonte especifica de dados, como Open-Meteo, INMET, CPTEC ou uma fonte de mercado.

`Repository`
: Encapsula persistencia local, IndexedDB, Firestore ou cache.

## Organizacao incremental

- `src/components/ui`: primitives reutilizaveis e sem regra de negocio.
- `src/components/layout`: shell, header, footer, sidebar e navegacao.
- `src/modules/<modulo>`: paginas, componentes, hooks, services, tipos e testes de uma area funcional.
- `src/domains/<dominio>`: tipos e regras estaveis de dominio.
- `src/services`: integracoes compartilhadas e adapters de infraestrutura.
- `src/lib`: utilitarios estruturais, como erros e clients.

## Regra para contextos

- Contextos globais devem ser acessados por hooks pequenos.
- Paginas nao devem depender de muitos campos do `AppDataContext`.
- Antes de dividir um contexto, crie hooks derivados para reduzir acoplamento.

## Compatibilidade durante refatoracao

- Mantenha reexports temporarios quando mover arquivos.
- Migre imports por modulo, nao em massa sem necessidade.
- Rode build, lint e testes depois de cada fase importante.
