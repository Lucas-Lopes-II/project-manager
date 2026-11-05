# ADR-0028: Filtros da listagem na API, com o estado na URL

- **Status**: Accepted
- **Data**: 2026-11-05
- **Feature**: F9

## Contexto e problema

A listagem ganha o filtro "Apenas Favoritos" (F9), a ordenação (F10) e a busca por nome (F11). O título continua mostrando o total de projetos cadastrados, mesmo com o filtro ligado. É preciso definir onde a lista é filtrada e onde fica o estado desses controles.

## Drivers da decisão

- Um único lugar com as regras da lista: filtro, ordenação com acentos e busca.
- Um caminho para paginar sem mudar o contrato, se o volume crescer.
- Estado que sobrevive ao recarregar a página e ao voltar de outra tela.
- Resposta rápida, sem a lista piscar.

## Decisão

1. A API filtra a lista: `GET /api/v1/projects?favorite=true` retorna só os favoritos, e um valor diferente de `true` responde 400. A F10 e a F11 acrescentam os seus parâmetros na mesma rota.
2. O `total` continua contando todos os projetos cadastrados, como o [ADR-0009](0009-contrato-rest-de-projetos.md) já previa.
3. O estado dos controles fica na URL da listagem, como `?favoritos=true`. Mudar o filtro substitui a entrada do histórico, e as telas de formulário voltam para a lista com a mesma URL.
4. Ao mudar o filtro, a lista atual continua na tela até a resposta chegar, e uma requisição antiga é cancelada.
5. Não há paginação, porque o design mostra todos os projetos em uma grade, sem controles de página.

## Alternativas consideradas

- **Filtrar no navegador, sobre a lista já carregada:** o toggle responderia sem requisição, mas a ordenação e a busca ficariam divididas entre o navegador e o banco, e o filtro precisaria ir para a API assim que houvesse paginação.
- **Estado só na memória:** é mais simples, mas se perde ao recarregar a página.
- **Estado no `localStorage`:** sobrevive ao recarregar, mas pode deixar o filtro ligado sem a pessoa perceber.

## Consequências

- A lista tem um único conjunto de regras, no banco.
- Cada mudança de filtro faz uma requisição, de cerca de 150 ms em produção.
- A resposta cresce com o número de projetos, em cerca de 200 bytes por projeto. Se o volume crescer, o próximo passo é acrescentar `limit` e `offset`, ou um cursor, com rolagem infinita, sem mudar o formato da resposta.
- O link de uma lista filtrada pode ser compartilhado.
