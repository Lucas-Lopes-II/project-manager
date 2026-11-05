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
| [0009](0009-contrato-rest-de-projetos.md) | Contrato REST de projetos | Accepted | F2 |
| [0010](0010-migrations-com-goose.md) | Migrations com goose | Accepted | F2 |
| [0011](0011-datas-sem-horario.md) | Datas sem horário | Accepted | F2 |
| [0012](0012-regras-de-validacao-de-projetos.md) | Regras de validação de projetos | Accepted | F2 |
| [0013](0013-sem-login-e-com-dados-compartilhados.md) | Sem login e com dados compartilhados | Accepted | F2 |
| [0014](0014-css-moderno-com-tokens.md) | CSS moderno com tokens | Accepted | F3 |
| [0015](0015-organizacao-do-front-end-por-feature.md) | Organização do front-end por feature | Accepted | F3 |
| [0016](0016-estado-com-pinia-e-cliente-com-fetch.md) | Estado com Pinia e cliente HTTP com fetch | Accepted | F3 |
| [0017](0017-front-end-servido-por-nginx-no-compose.md) | Front-end servido por nginx no Compose | Accepted | F3 |
| [0018](0018-hospedagem-em-uma-vm-com-docker-compose.md) | Hospedagem em uma VM com Docker Compose | Accepted | F4 |
| [0019](0019-publicacao-por-imagens-com-atualizacao-pela-vm.md) | Publicação por imagens, com atualização a partir da VM | Accepted | F4 |
| [0020](0020-estados-sem-design.md) | Estados sem design | Accepted | F5 |
| [0021](0021-testes-e2e-com-cypress.md) | Testes E2E com Cypress contra a aplicação real | Accepted | F5 |
| [0022](0022-capas-no-postgresql.md) | Capas no PostgreSQL | Accepted | F6 |
| [0023](0023-capa-enviada-junto-com-o-projeto.md) | Capa enviada junto com o projeto | Accepted | F6 |
| [0024](0024-campos-de-data-nativos.md) | Campos de data nativos, com o visual do design | Accepted | F6 |
| [0025](0025-formulario-de-edicao-busca-na-api.md) | Formulário de edição busca o projeto na API | Accepted | F7 |
| [0026](0026-modal-com-dialog-nativo.md) | Modal com o elemento `<dialog>` nativo | Accepted | F8 |
| [0027](0027-favorito-como-sub-recurso.md) | Favorito como sub-recurso do projeto | Accepted | F9 |
| [0028](0028-filtros-da-listagem-na-api.md) | Filtros da listagem na API, com o estado na URL | Accepted | F9 |

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
