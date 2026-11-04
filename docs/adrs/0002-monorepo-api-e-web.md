# ADR-0002: Monorepo com API e front-end

- **Status**: Accepted
- **Data**: 2026-11-04
- **Feature**: F0

## Contexto e problema

O projeto tem uma API em Go e uma aplicação web em TypeScript. É preciso definir se as duas partes ficam no mesmo repositório, considerando que cada feature costuma alterar as duas ao mesmo tempo.

## Drivers da decisão

- Clonar e rodar tudo a partir de um único endereço.
- Revisar a mudança na API e no front-end no mesmo pull request.
- Não adicionar ferramentas sem necessidade.

## Decisão

Usar um único repositório, sem ferramenta de monorepo:

```text
api/           API em Go, com go.mod próprio
web/           aplicação web, com package.json próprio
docs/          ADRs, features e contrato da API
compose.yaml   ambiente local
```

## Alternativas consideradas

- **Um repositório para cada parte:** exige clonar dois projetos e manter a compatibilidade entre versões, além de separar em dois pull requests uma mudança que é uma só.
- **Monorepo com Nx ou Turborepo:** essas ferramentas ajudam a compartilhar pacotes e cache de build. Com duas partes em linguagens diferentes, sem código compartilhado, o custo não se paga.

## Consequências

- Uma mudança completa fica em um único pull request, e `docker compose` sobe o ambiente a partir da raiz.
- O CI precisa de um job para cada parte.
- Cada hospedagem precisa ser configurada para usar a sua subpasta no deploy.
