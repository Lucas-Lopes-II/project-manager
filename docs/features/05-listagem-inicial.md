# F5: Listagem inicial

## Objetivo

Mostrar a tela inicial com dados reais da API: a lista vazia do Figma ou o título com o total de projetos, além dos estados de carregamento e de erro.

## Escopo

- Store do Pinia que busca os projetos na API e guarda os itens, o total e o estado da requisição.
- Lista vazia, como no Figma, com o botão "Novo projeto".
- Título "Projetos (N)", com o `total` da API, quando há projetos.
- Estados de carregamento e de erro, com a opção de tentar de novo.
- Rota `/projetos/novo`, com uma página provisória até a F6.
- Testes de unidade com Vitest.
- Cypress configurado, com os testes E2E da listagem e um job próprio no CI.
- README atualizado.

## Fora do escopo

- Cards dos projetos e formulário de criação (F6).
- Filtro de favoritos (F9), ordenação (F10) e busca (F11).
- Estados de zero favoritos, de busca sem resultado e de projeto inexistente, que entram com as suas features e seguem o [ADR-0020](../adrs/0020-estados-sem-design.md).

## Critérios de aceite

1. Com o banco vazio, a tela reproduz a lista vazia do Figma, em comparação lado a lado na largura do design.
2. Com projetos cadastrados, o título mostra o total informado pela API, e a lista vazia não aparece.
3. Enquanto a API não responde, a tela informa o carregamento, sem mostrar a lista vazia. Respostas rápidas não fazem o texto piscar.
4. Se a API falhar, a tela mostra o erro e o botão "Tentar novamente", que repete a busca e mostra o resultado.
5. O botão "Novo projeto" leva a `/projetos/novo`.
6. Os estados de carregamento e de erro são anunciados a leitores de tela.
7. O layout não gera rolagem horizontal em 1366, 1440 e 1920 px.
8. `npm run test:e2e` roda contra a aplicação real, em uma stack separada, sem tocar nos dados do ambiente de desenvolvimento.
9. O CI roda os testes E2E, e as imagens só são publicadas se eles passarem.

## Decisões relacionadas

- [ADR-0020: Estados sem design](../adrs/0020-estados-sem-design.md)
- [ADR-0021: Testes E2E com Cypress contra a aplicação real](../adrs/0021-testes-e2e-com-cypress.md)
