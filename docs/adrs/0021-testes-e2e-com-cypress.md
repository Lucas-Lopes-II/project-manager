# ADR-0021: Testes E2E com Cypress contra a aplicação real

- **Status**: Accepted
- **Data**: 2026-11-05
- **Feature**: F5

## Contexto e problema

Os fluxos principais atravessam o navegador, o nginx, a API e o banco. Os testes de unidade não cobrem essa ligação, e cada feature a partir da F5 acrescenta os seus testes E2E. É preciso definir o que roda por baixo desses testes e como eles lidam com os dados, já que o teste da lista vazia depende de um banco sem projetos.

## Drivers da decisão

- Confiança no fluxo completo, incluindo o encaminhamento do nginx, o contrato da API e a persistência.
- Testes independentes da ordem e dos dados de quem os executa.
- Nenhum risco para os dados de desenvolvimento ou de produção.
- Um único comando, igual na máquina local e no CI.

## Decisão

1. O Cypress fica em `web/`, com os testes em `web/cypress/e2e/`.
2. Os testes rodam contra a aplicação real, em um projeto separado do Compose, com portas e volume próprios. Essa stack começa vazia e é removida no fim.
3. Os dados são preparados pela API, com `cy.request`, e o banco é limpo antes de cada teste. A limpeza se recusa a rodar em outro endereço que não o da stack de testes.
4. `cy.intercept` simula só o que a aplicação real não produz sob demanda, como uma falha da API ou uma resposta lenta.
5. O CI tem um job próprio para esses testes, e as imagens só são publicadas se ele passar.

## Alternativas consideradas

- **Simular a API em todos os testes:** é mais rápido e dispensa o Docker, mas não detecta erros no nginx, no contrato ou no banco, e os dados simulados podem se afastar da API real.
- **Usar a stack de desenvolvimento:** dispensa um segundo projeto do Compose, mas os testes apagariam os dados de quem os executa ou falhariam por causa deles.
- **Playwright:** é uma ótima alternativa, mas o anúncio da vaga cita o Cypress, e o projeto não precisa de nada que só o Playwright ofereça.

## Consequências

- Rodar os testes exige o Docker, e o job do CI inclui o build das imagens, o que o deixa mais lento do que os demais.
- Os testes não dependem de quem os executa nem do ambiente de desenvolvimento estar no ar.
- O Cypress baixa um binário grande na instalação, então o build da imagem e os jobs que não executam os testes precisam pular esse download.
