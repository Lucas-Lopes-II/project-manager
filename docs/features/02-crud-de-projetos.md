# F2: CRUD de projetos na API

## Objetivo

Permitir criar, listar, consultar, editar e remover projetos pela API, com as regras de validação, os dados salvos no banco e o contrato documentado.

## Escopo

- Migrations aplicadas ao iniciar a API, com a tabela de projetos.
- Pacote `internal/project`, com domínio, service, repository e handler.
- Rotas definidas no [ADR-0009](../adrs/0009-contrato-rest-de-projetos.md).
- Validação definida no [ADR-0012](../adrs/0012-regras-de-validacao-de-projetos.md), com os erros no formato do [ADR-0007](../adrs/0007-contrato-de-erros-da-api.md).
- Listagem em ordem alfabética, sem diferenciar maiúsculas e acentos.
- Contrato em `docs/openapi.yaml`, validado no CI.
- Testes de unidade e de integração com banco real.
- README atualizado.

## Fora do escopo

- Capa do projeto (F6).
- Favoritos e filtro (F9).
- Outras ordenações (F10).
- Busca (F11).

## Critérios de aceite

1. Ao iniciar, a API aplica as migrations pendentes. Um novo início não as reaplica, e duas instâncias iniciadas juntas não entram em conflito.
2. `POST /api/v1/projects` com dados válidos responde 201, com o projeto e o cabeçalho `Location`.
3. `GET /api/v1/projects` responde 200, com os projetos e o total. "abacate", "Alfa", "área" e "Avião" aparecem nessa ordem.
4. `GET /api/v1/projects/{id}` responde 200 com o projeto. Um ID inexistente ou malformado responde 404.
5. `PUT /api/v1/projects/{id}` com dados válidos responde 200 e substitui os campos. Um ID inexistente responde 404.
6. `DELETE /api/v1/projects/{id}` responde 204, e o projeto deixa de existir. Remover de novo responde 404.
7. Dados inválidos respondem 422, listando de uma só vez todos os campos com erro, com os códigos do ADR-0012.
8. JSON malformado responde 400, e um corpo acima de 1 MB responde 413.
9. Uma data enviada como `2026-11-04` volta exatamente como `2026-11-04`.
10. `docs/openapi.yaml` descreve todas as rotas e códigos de erro, e o CI valida o arquivo.
11. O CI passa com os testes de unidade e de integração.

## Decisões relacionadas

- [ADR-0009: Contrato REST de projetos](../adrs/0009-contrato-rest-de-projetos.md)
- [ADR-0010: Migrations com goose](../adrs/0010-migrations-com-goose.md)
- [ADR-0011: Datas sem horário](../adrs/0011-datas-sem-horario.md)
- [ADR-0012: Regras de validação de projetos](../adrs/0012-regras-de-validacao-de-projetos.md)
- [ADR-0013: Sem login e com dados compartilhados](../adrs/0013-sem-login-e-com-dados-compartilhados.md)
