# ADR-0003: Vue 3 com TypeScript no front-end

- **Status**: Accepted
- **Data**: 2026-11-04
- **Feature**: F0

## Contexto e problema

O desafio permite qualquer framework JavaScript ou TypeScript, mas avalia a aderência às stacks da vaga, que usa Vue no front-end. Minha experiência em produção é com Angular e React, e ainda não com Vue.

## Drivers da decisão

- Aderência à stack da vaga.
- Entrega dentro do prazo do desafio.
- Código idiomático no framework escolhido.

## Decisão

Usar Vue 3 com Composition API, `<script setup>` e TypeScript, em uma SPA construída com Vite.

## Alternativas consideradas

- **React:** é o caminho de maior velocidade inicial, mas não atende à aderência à stack.
- **Angular:** também é conhecido, mas não atende à aderência à stack e exige mais estrutura para uma aplicação deste tamanho.
- **Nuxt:** o desafio não precisa de renderização no servidor nem de SEO, então o framework adicionaria complexidade sem ganho, inclusive no deploy.

## Consequências

- O projeto usa a mesma stack de front-end da vaga.
- Há uma curva de aprendizado inicial, reduzida pela semelhança com conceitos de Angular e React, como signals, diretivas e hooks.
- Existe o risco de escrever Vue com hábitos de outros frameworks. Para reduzi-lo, o projeto seguirá o guia de estilo oficial e usará o `eslint-plugin-vue`.
