# Gerenciador de Projetos

Aplicação para visualizar, adicionar, editar, remover e favoritar projetos.

**Acesse:** https://gerenciador-projetos-lucas.duckdns.org

> Em desenvolvimento. Por enquanto, o repositório contém a API de projetos, a listagem com o filtro de favoritos e a criação, a edição e a remoção de projetos com capa.

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

O comando termina quando tudo está pronto. A aplicação fica em `http://localhost:3000` e a API em `http://localhost:8080`.

Se alguma das portas 3000, 5432 ou 8080 estiver ocupada, altere `WEB_PORT`, `POSTGRES_PORT` ou `API_PORT` no `.env`.

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

## Desenvolvimento do front-end

É preciso ter o Node 24 instalado. Com o banco e a API no ar pelo Compose:

```bash
cd web
nvm use
npm ci
npm run dev   # http://localhost:5173, com /api encaminhado para a API
```

Se a API estiver em outra porta, defina `API_PROXY_TARGET`.

## Produção

A aplicação roda em uma única VM com Docker Compose, e cada merge na `main` é publicado automaticamente. Os detalhes estão em [docs/deploy.md](docs/deploy.md).

## Testes

Na API, é preciso ter o Go e o Docker instalados:

```bash
cd api
go test ./...          # todos os testes; os de integração sobem um PostgreSQL em container
go test -short ./...   # só os testes de unidade
```

No front-end:

```bash
cd web
npm test
npm run lint
npm run type-check
```

Os testes E2E, com Cypress, precisam do Docker e do Chrome. O comando sobe uma cópia separada da aplicação, roda os testes e a remove, sem tocar nos dados do ambiente local:

```bash
cd web
npm run test:e2e
```

Para acompanhar os testes na interface do Cypress, rode `npm run e2e:up`, depois `npm run test:e2e:open` e, ao terminar, `npm run e2e:down`.

## Estrutura

```text
api/                API em Go
web/                aplicação em Vue
docs/               ADRs, features e contrato da API
compose.yaml        ambiente local
compose.prod.yaml   produção
deploy/             configuração e scripts da VM
```

## Documentação

- [Decisões técnicas (ADRs)](docs/adrs/README.md)
- [Features](docs/features/)
- [Deploy](docs/deploy.md)
