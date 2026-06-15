# Adicionando funcionalidades

## Nova tela

1. Crie a pagina ou modulo em `src/modules/<modulo>`.
2. Crie componentes pequenos em `components`.
3. Crie um hook de tela em `hooks`.
4. Chame services ou repositories pelo hook.
5. Use primitives de `src/components/ui`.
6. Adicione a rota em `src/routes`.
7. Rode build, lint e testes.

## Nova API externa

1. Crie um provider para a fonte especifica.
2. Normalize a resposta no gateway ou service do modulo.
3. Modele status, fonte, `updatedAt` e fallback.
4. Garanta que a pagina nao saiba qual provider respondeu.
5. Adicione testes para normalizacao e fallback.

## Nova cultura no mercado

1. Atualize o perfil estadual ou fonte de referencia.
2. Garanta unidade, categoria, prioridade e fonte.
3. Normalize historico e variacoes.
4. Marque claramente dado real, referencia ou indisponibilidade.
5. Valide a tela de mercado e os testes de service.

## Novo alerta climatico

1. Modele o tipo no dominio de alertas.
2. Implemente a regra no service ou engine responsavel.
3. Use dados normalizados de clima, nao acesso direto a providers.
4. Inclua severidade, justificativa e fonte.
5. Adicione teste cobrindo o limiar principal e um caso sem alerta.
