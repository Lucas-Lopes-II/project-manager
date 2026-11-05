# F9: Favoritos

## Objetivo

Permitir marcar projetos como favoritos pela estrela do card e mostrar apenas os favoritos com o toggle "Apenas Favoritos", como no Figma.

## Escopo

- API: campo `favorite`, filtro `?favorite=true` na listagem e as rotas `PUT` e `DELETE` em `/api/v1/projects/{id}/favorite` ([ADR-0027](../adrs/0027-favorito-como-sub-recurso.md) e [ADR-0028](../adrs/0028-filtros-da-listagem-na-api.md)).
- Estrela no card: laranja quando o projeto é favorito e contorno branco quando não é.
- Toggle "Apenas Favoritos" na barra da listagem, com o estado na URL.
- Estado de nenhum favorito.
- Testes da API com banco real, testes de unidade e testes E2E.
- OpenAPI e README atualizados.

## Fora do escopo

- Ordenação (F10) e busca (F11), que usam o mesmo padrão de filtros.
- Paginação, porque o design não tem controles de página ([ADR-0028](../adrs/0028-filtros-da-listagem-na-api.md)).

## Critérios de aceite

1. A estrela marca e desmarca o projeto na hora, e o estado continua depois de recarregar a página.
2. Se a API falhar, a estrela volta ao estado anterior, e aparece "Não foi possível atualizar o favorito. Tente novamente."
3. Com "Apenas Favoritos" ligado, só os favoritos aparecem, e o título continua com o total de projetos cadastrados.
4. O estado do toggle fica na URL, sobrevive ao recarregar a página e é mantido ao voltar das telas de formulário.
5. Ao mudar o filtro, a lista atual continua na tela até a resposta chegar.
6. Desmarcar um projeto com o filtro ligado o tira da lista na hora, e o foco vai para o título.
7. Sem nenhum favorito, aparece "Nenhum projeto favorito" e "Clique na estrela de um projeto para encontrá-lo aqui.", com a barra visível para desligar o filtro.
8. A estrela e o toggle funcionam pelo teclado e informam o estado a leitores de tela.
9. A estrela, o toggle e a barra reproduzem o Figma na largura do design, e não há rolagem horizontal em 1366, 1440 e 1920 px.

## Textos sem design

| Situação | Texto |
|---|---|
| Nenhum favorito | "Nenhum projeto favorito" e "Clique na estrela de um projeto para encontrá-lo aqui." |
| Falha ao favoritar | "Não foi possível atualizar o favorito. Tente novamente." |

## Decisões relacionadas

- [ADR-0027: Favorito como sub-recurso do projeto](../adrs/0027-favorito-como-sub-recurso.md)
- [ADR-0028: Filtros da listagem na API, com o estado na URL](../adrs/0028-filtros-da-listagem-na-api.md)
- [ADR-0020: Estados sem design](../adrs/0020-estados-sem-design.md)
