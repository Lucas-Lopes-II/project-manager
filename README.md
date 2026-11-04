# Gerenciador de Projetos

Aplicação para visualizar, adicionar, editar, remover e favoritar projetos.

> Em desenvolvimento. Por enquanto, o repositório contém a fundação do projeto e o esqueleto da API.

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
docs/          ADRs e documentos das features
compose.yaml   ambiente local
```

A pasta `web/` entra em uma próxima feature, conforme o [ADR-0002](docs/adrs/0002-monorepo-api-e-web.md).

## Documentação

- [Decisões técnicas (ADRs)](docs/adrs/README.md)
- [Features](docs/features/)
