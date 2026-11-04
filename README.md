# Gerenciador de Projetos

Aplicação para visualizar, adicionar, editar, remover e favoritar projetos.

> Em desenvolvimento. Por enquanto, o repositório contém a API de projetos, ainda sem o front-end.

## Stack

- **Front-end:** Vue 3, TypeScript e Vite
- **API:** Go
- **Banco de dados:** PostgreSQL 17

## Como rodar

É preciso ter o Docker com o Compose instalado.

```bash
cp .env.example .env
docker compose up -d --wait --build
```

O comando termina quando o banco e a API estão prontos. Para conferir:

```bash
curl http://localhost:8080/ready
```

Se as portas 5432 ou 8080 estiverem ocupadas, altere `POSTGRES_PORT` ou `API_PORT` no `.env`.

Para parar o ambiente:

```bash
docker compose down     # mantém os dados
docker compose down -v  # apaga os dados
```

## API

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/v1/projects` | Lista os projetos |
| `POST` | `/api/v1/projects` | Cria um projeto |
| `GET` | `/api/v1/projects/{id}` | Consulta um projeto |
| `PUT` | `/api/v1/projects/{id}` | Substitui os campos de um projeto |
| `DELETE` | `/api/v1/projects/{id}` | Remove um projeto |

O contrato completo está em [docs/openapi.yaml](docs/openapi.yaml).

```bash
curl -X POST http://localhost:8080/api/v1/projects \
  -H 'Content-Type: application/json' \
  -d '{"name":"Projeto Iridium","client":"Clicksign","start_date":"2026-11-04","end_date":"2026-12-12"}'
```

## Testes

É preciso ter o Go e o Docker instalados.

```bash
cd api
go test ./...          # todos os testes; os de integração sobem um PostgreSQL em container
go test -short ./...   # só os testes de unidade
```

## Estrutura

```text
api/           API em Go
docs/          ADRs, features e contrato da API
compose.yaml   ambiente local
```

A pasta `web/` entra em uma próxima feature, conforme o [ADR-0002](docs/adrs/0002-monorepo-api-e-web.md).

## Documentação

- [Decisões técnicas (ADRs)](docs/adrs/README.md)
- [Features](docs/features/)
