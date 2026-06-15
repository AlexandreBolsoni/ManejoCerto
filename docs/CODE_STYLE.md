# Padrao de codigo do NimbuES

## Nomeacao

- Componentes React usam `PascalCase.tsx`.
- Hooks usam `useNomeDoCaso.ts`.
- Services, gateways, providers e repositories usam `camelCase.ts`.
- Tipos de dominio ficam em `src/domains/<dominio>/<dominio>.types.ts` quando forem migrados.
- Testes ficam proximos da regra testada com sufixo `.test.ts`.

## Componentes

- Componentes de UI reutilizaveis ficam em `src/components/ui`.
- Todo componente deve declarar props tipadas.
- Componentes estruturais devem aceitar `children` quando fizer sentido.
- Variantes visuais devem usar union types, nao strings soltas.
- Componentes de UI nao devem acessar API, Firebase, storage, contexto global ou regra de negocio.

## Paginas

- Paginas devem montar a experiencia, nao concentrar regra de negocio.
- Evite `fetch`, `localStorage`, Firestore e IndexedDB diretamente em paginas.
- Extraia blocos grandes de JSX para componentes de modulo.
- Extraia decisao de dados para hooks ou services.

## Hooks

- Hooks de tela ficam em `src/modules/<modulo>/hooks`.
- Hooks de dominio compartilhados podem ficar em `src/hooks` ou no dominio correspondente.
- Hooks podem ler contextos, mas devem devolver dados prontos para a tela.
- Hooks nao devem retornar JSX.

## Dados assincronos

- Use `AsyncData<T>` de `src/types/async.types` para estados com loading, erro, sucesso e atualizacao.
- Use `DataState` para padronizar loading, erro e vazio quando a tela permitir.
- Mensagens tecnicas devem ser traduzidas antes de aparecer para o usuario.

## Erros

- Services devem preferir `AppError` de `src/lib/errors/appError.ts`.
- `details` e logs podem guardar dados tecnicos.
- A UI deve mostrar mensagens amigaveis com `toUserMessage`.

## Evitar

- `any` sem justificativa clara.
- Regra de negocio complexa dentro do JSX.
- Componentes que misturam clima, mercado, fazenda e layout ao mesmo tempo.
- Duplicar botao, card, empty state ou input em paginas.
