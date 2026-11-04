# ADR-0008: Testes de integração com banco real

- **Status**: Accepted
- **Data**: 2026-11-04
- **Feature**: F1

## Contexto e problema

O repository usa SQL explícito, com recursos específicos do PostgreSQL ([ADR-0005](0005-arquitetura-da-api-em-go.md) e [ADR-0006](0006-postgresql-como-banco-de-dados.md)). Esse SQL só é validado de verdade quando roda em um PostgreSQL, e os testes precisam funcionar da mesma forma na máquina de quem desenvolve e no CI.

## Drivers da decisão

- Validar o SQL real, com as mesmas extensões da aplicação.
- Rodar tudo com `go test ./...`, sem configuração manual.
- Manter os testes isolados entre si e do banco de desenvolvimento.

## Decisão

Usar o `testcontainers-go` para subir um container com a mesma imagem do Compose durante os testes de integração.

- Cada pacote que precisa de banco usa um container próprio, iniciado no `TestMain`.
- Testes de unidade não dependem de Docker.
- `go test -short ./...` pula os testes de integração.

## Alternativas consideradas

- **Mock do banco (`pgxmock`):** é rápido, mas confirma só que uma query foi chamada, não que ela funciona.
- **Banco do Compose:** não adiciona dependências, mas exige configuração prévia e divide o estado com o desenvolvimento.
- **Service container no CI, com variável de ambiente:** funciona, mas faz o CI e a máquina local rodarem de formas diferentes.
- **SQLite em memória:** é rápido, mas usa outro dialeto e não tem as extensões usadas.

## Consequências

- Os testes validam o mesmo banco usado pela aplicação.
- Os testes de integração exigem Docker, que o README já pede.
- O `testcontainers-go` adiciona dependências de teste, e cada pacote leva alguns segundos a mais para iniciar.
