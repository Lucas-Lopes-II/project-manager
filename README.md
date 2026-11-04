# Gerenciador de Projetos

Aplicação para visualizar, adicionar, editar, remover e favoritar projetos.

> Em desenvolvimento. Por enquanto, o repositório contém a fundação do projeto e o banco de dados local.

## Stack

- **Front-end:** Vue 3, TypeScript e Vite
- **API:** Go
- **Banco de dados:** PostgreSQL 17

## Como rodar

É preciso ter o Docker com o Compose instalado.

```bash
cp .env.example .env
docker compose up -d --wait
```

O comando termina quando o banco está pronto para uso. Se a porta 5432 estiver ocupada, altere `POSTGRES_PORT` no `.env`.

Para parar o ambiente:

```bash
docker compose down     # mantém os dados
docker compose down -v  # apaga os dados
```

## Estrutura

```text
docs/          ADRs e documentos das features
compose.yaml   ambiente local
```

As pastas `api/` e `web/` entram nas próximas features, conforme o [ADR-0002](docs/adrs/0002-monorepo-api-e-web.md).

## Documentação

- [Decisões técnicas (ADRs)](docs/adrs/README.md)
- [Features](docs/features/)
