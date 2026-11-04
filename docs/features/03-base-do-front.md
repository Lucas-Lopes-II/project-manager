# F3: Base do front-end

## Objetivo

Ter a aplicação Vue rodando, com os tokens do design, o layout principal, o cliente HTTP e as ferramentas de qualidade, pronta para receber as telas.

## Escopo

- Projeto em `web/` com Vue 3, TypeScript, Vite, Vue Router e Pinia, em Node 24.
- Tokens de cor, tipografia, espaçamento, raio e sombra do Figma, em custom properties.
- Fontes servidas pela própria aplicação.
- Logo e ícones exportados do Figma.
- Layout principal, com o cabeçalho e a área de conteúdo. O ícone de busca aparece no cabeçalho e ganha ação na F11.
- Cliente HTTP com `fetch`, que converte as respostas de erro da API em um erro tipado.
- Encaminhamento de `/api` para a API, pelo Vite em desenvolvimento e pelo nginx no Compose.
- ESLint com `eslint-plugin-vue`, verificação de tipos e Vitest.
- `Dockerfile` da aplicação e serviço `web` no Compose, com healthcheck.
- Job de CI para o front-end: lint, tipos, testes e build.
- README atualizado.

## Fora do escopo

- Telas e componentes das features, a partir da F5.
- Cypress, que entra na F5, junto com a primeira tela.
- Deploy (F4).

## Critérios de aceite

1. `docker compose up -d --wait --build` termina com o banco, a API e o `web` saudáveis, e `http://localhost:3000` abre a aplicação.
2. `npm run dev` abre a aplicação com atualização automática, e as chamadas para `/api` chegam à API.
3. O cabeçalho reproduz o Figma em cor, altura, logo e ícone, em comparação lado a lado na largura do design.
4. As fontes carregam sem nenhuma requisição a servidores externos.
5. O layout não gera rolagem horizontal em 1366, 1440 e 1920 px.
6. Recarregar a página em uma rota interna abre a aplicação no Compose, e `/api/v1/projects` responde pelo nginx.
7. O cliente HTTP trata sucesso, resposta 204, erro com os campos inválidos, erro sem corpo JSON e cancelamento, com testes.
8. O CI roda lint, verificação de tipos, testes e build do front-end.

## Decisões relacionadas

- [ADR-0014: CSS moderno com tokens](../adrs/0014-css-moderno-com-tokens.md)
- [ADR-0015: Organização do front-end por feature](../adrs/0015-organizacao-do-front-end-por-feature.md)
- [ADR-0016: Estado com Pinia e cliente HTTP com fetch](../adrs/0016-estado-com-pinia-e-cliente-com-fetch.md)
- [ADR-0017: Front-end servido por nginx no Compose](../adrs/0017-front-end-servido-por-nginx-no-compose.md)
