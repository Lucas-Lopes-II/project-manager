# F0: Fundação do repositório

## Objetivo

Deixar o repositório pronto para receber a API e o front-end, com banco de dados local, integração contínua e documentação inicial.

## Escopo

- Arquivos base: `.gitignore` e `.editorconfig`.
- `compose.yaml` com PostgreSQL 17, healthcheck e volume nomeado.
- `.env.example` com as variáveis do banco.
- Workflow de CI no GitHub Actions que sobe o Compose e aguarda o banco ficar saudável.
- README inicial com objetivo, stack, como subir o banco e links para a documentação.
- ADRs das decisões estruturais e índice em `docs/adrs/README.md`.

## Fora do escopo

- Código da API (F1) e do front-end (F3). Os serviços e os jobs de CI correspondentes entram nessas features.
- Deploy (F4).

## Critérios de aceite

1. Com um `.env` copiado de `.env.example`, `docker compose up -d --wait` termina com o PostgreSQL saudável.
2. O CI roda em pull requests e em pushes na `main`, e termina com sucesso.
3. O README permite subir o banco sem nenhuma outra instrução.
4. Nenhum segredo é versionado: o `.env` é ignorado pelo git.
5. Os ADRs abaixo estão com status `Accepted` e listados no índice.

## Decisões relacionadas

- [ADR-0001: Registrar decisões com ADRs](../adrs/0001-registrar-decisoes-com-adrs.md)
- [ADR-0002: Monorepo com API e front-end](../adrs/0002-monorepo-api-e-web.md)
- [ADR-0003: Vue 3 com TypeScript no front-end](../adrs/0003-vue-3-no-front-end.md)
