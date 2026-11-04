# ADR-0009: Contrato REST de projetos

- **Status**: Accepted
- **Data**: 2026-11-04
- **Feature**: F2

## Contexto e problema

O front-end precisa listar, consultar, criar, editar e remover projetos. As rotas e o formato dos dados precisam ser definidos antes da implementação e continuar estáveis quando capa, favoritos, ordenação e busca forem adicionados.

## Drivers da decisão

- Rotas previsíveis, seguindo as convenções de REST.
- Espaço para evoluir sem quebrar o contrato.
- Aderência ao que o design mostra.

## Decisão

| Método | Rota | Sucesso |
|---|---|---|
| `GET` | `/api/v1/projects` | 200 |
| `POST` | `/api/v1/projects` | 201, com `Location` |
| `GET` | `/api/v1/projects/{id}` | 200 |
| `PUT` | `/api/v1/projects/{id}` | 200 |
| `DELETE` | `/api/v1/projects/{id}` | 204 |

```json
{
  "items": [
    {
      "id": "61705246-aacf-4373-875a-08f4dd31428c",
      "name": "Projeto Iridium",
      "client": "Clicksign",
      "start_date": "2026-11-04",
      "end_date": "2026-12-12",
      "created_at": "2026-11-04T18:21:55Z",
      "updated_at": "2026-11-04T18:21:55Z"
    }
  ],
  "total": 1
}
```

- Os IDs são UUIDs gerados pelo banco, e o JSON usa `snake_case`.
- A listagem traz todos os projetos, em ordem alfabética com a collation `pt-BR-x-icu`.
- `total` conta os projetos cadastrados, mesmo quando houver filtro, como mostra o design.
- A remoção é definitiva, como diz o modal de confirmação.

## Alternativas consideradas

- **`PATCH` na edição:** é útil para alterações parciais, mas o formulário sempre envia todos os campos.
- **IDs sequenciais:** são mais simples, mas revelam a quantidade de registros e facilitam a enumeração.
- **Paginação:** o design mostra todos os projetos em uma grade, sem controles de página, e o volume esperado é pequeno.
- **Remoção lógica:** permitiria desfazer, mas o design não prevê isso e informa que a remoção é definitiva.
- **Rotas sem versão:** seriam mais curtas, mas `/api/v1` não tem custo e permite evoluir o contrato.

## Consequências

- O contrato fica simples para o front-end, e novos campos podem entrar sem quebrar quem já o consome.
- A resposta da listagem cresce com o número de projetos. Se o volume aumentar, será preciso paginar, e o formato com `items` e `total` já comporta isso.
- Não há controle de edição concorrente, então a última gravação prevalece.
