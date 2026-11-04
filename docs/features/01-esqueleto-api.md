# F1: Esqueleto da API

## Objetivo

Ter uma API em Go rodando no Compose, conectada ao banco, com configuração, logs, tratamento de erros, testes e CI prontos para receber os endpoints de projetos.

## Escopo

- Módulo Go em `api/`, seguindo o [ADR-0005](../adrs/0005-arquitetura-da-api-em-go.md).
- Configuração por variáveis de ambiente (`PORT` e `DATABASE_URL`), com falha imediata e mensagem clara quando faltar algum valor obrigatório.
- Conexão com o PostgreSQL por um pool do `pgx`.
- `GET /health`, que responde se o processo está no ar, sem acessar o banco.
- `GET /ready`, que responde se a API consegue usar o banco.
- Respostas de erro no formato do [ADR-0007](../adrs/0007-contrato-de-erros-da-api.md), inclusive para rota inexistente, método não permitido e panic.
- Middlewares de request ID, log da requisição e recuperação de panic.
- Encerramento gracioso ao receber `SIGTERM`.
- `Dockerfile` da API e serviço `api` no Compose, com healthcheck.
- Job de CI para a API: lint, testes e build.
- README atualizado.

Os caminhos dos health checks não terminam em `z` porque o Cloud Run reserva parte desses caminhos.

## Fora do escopo

- Endpoints de projetos e migrations (F2).
- CORS: em desenvolvimento, o Vite encaminha as chamadas para a API (F3); em produção, a hospedagem do front faz o mesmo (F4).

## Critérios de aceite

1. `docker compose up -d --wait` termina com o banco e a API saudáveis.
2. `GET /health` responde 200 mesmo com o banco fora do ar.
3. `GET /ready` responde 200 com o banco no ar e 503 sem ele, com o erro no formato definido.
4. Rota inexistente responde 404 e método não permitido responde 405, ambos no formato definido.
5. Um panic em um handler responde 500 sem expor detalhes internos e registra a stack no log.
6. Cada requisição gera um log em JSON com `request_id`, método, caminho, status e duração, e a resposta traz o cabeçalho `X-Request-ID`.
7. Ao receber `SIGTERM`, a API termina as requisições em andamento antes de sair.
8. Sem `DATABASE_URL`, a API não inicia e informa qual variável está faltando.
9. `go test ./...` passa tendo só o Go e o Docker instalados.
10. O CI roda lint, testes com `-race` e build da API.

## Decisões relacionadas

- [ADR-0004: Fluxo de branches com pull requests](../adrs/0004-fluxo-de-branches.md)
- [ADR-0005: Arquitetura da API em Go](../adrs/0005-arquitetura-da-api-em-go.md)
- [ADR-0006: PostgreSQL como banco de dados](../adrs/0006-postgresql-como-banco-de-dados.md)
- [ADR-0007: Contrato de erros da API](../adrs/0007-contrato-de-erros-da-api.md)
- [ADR-0008: Testes de integração com banco real](../adrs/0008-testes-de-integracao-com-banco-real.md)
