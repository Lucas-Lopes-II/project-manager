# Architecture Decision Records

Registro das decisões técnicas do projeto, com o contexto e as alternativas avaliadas. O processo está descrito no [ADR-0001](0001-registrar-decisoes-com-adrs.md).

## Índice

| ADR | Decisão | Status | Feature |
|---|---|---|---|
| [0001](0001-registrar-decisoes-com-adrs.md) | Registrar decisões com ADRs | Accepted | F0 |
| [0002](0002-monorepo-api-e-web.md) | Monorepo com API e front-end | Accepted | F0 |
| [0003](0003-vue-3-no-front-end.md) | Vue 3 com TypeScript no front-end | Accepted | F0 |
| [0004](0004-fluxo-de-branches.md) | Fluxo de branches com pull requests | Accepted | F1 |
| [0005](0005-arquitetura-da-api-em-go.md) | Arquitetura da API em Go | Accepted | F1 |
| [0006](0006-postgresql-como-banco-de-dados.md) | PostgreSQL como banco de dados | Accepted | F1 |
| [0007](0007-contrato-de-erros-da-api.md) | Contrato de erros da API | Accepted | F1 |
| [0008](0008-testes-de-integracao-com-banco-real.md) | Testes de integração com banco real | Accepted | F1 |

## Modelo

```markdown
# ADR-NNNN: Título da decisão

- **Status**: Proposed | Accepted | Superseded by ADR-NNNN
- **Data**: AAAA-MM-DD
- **Feature**: FNN

## Contexto e problema
## Drivers da decisão
## Decisão
## Alternativas consideradas
## Consequências
```
