# F14: Segurança

## Objetivo

Proteger a aplicação pública de abuso: limitar as requisições por origem, limitar o espaço ocupado pelos dados e enviar os headers de segurança do navegador.

## Escopo

- Limite de requisições e de conexões por IP no nginx, com 429 no formato de erro da API ([ADR-0035](../adrs/0035-protecao-contra-abuso.md)).
- Teto de 200 projetos na API, com a mensagem no formulário.
- Content Security Policy e demais headers de segurança no nginx, e HSTS no Caddy.
- Testes da API com banco real, testes de unidade e testes E2E.
- OpenAPI e README atualizados.

## Fora do escopo

- CDN ou WAF na frente da VM, que exigem outro domínio.
- Login e permissões ([ADR-0013](../adrs/0013-sem-login-e-com-dados-compartilhados.md)).
- Acessibilidade, celular e comparação final com o Figma (F15).

## Critérios de aceite

1. Pelo Caddy, um IP que passa do limite recebe 429, e outro IP continua sendo atendido. Na API, o 429 vem no formato de erro do [ADR-0007](../adrs/0007-contrato-de-erros-da-api.md).
2. O uso normal da aplicação, incluindo uma lista com muitas capas, não chega aos limites.
3. O IP enviado pelo navegador no `X-Forwarded-For` não substitui o IP real.
4. Com 200 projetos, a criação responde 409 com o código `project_limit`, e o formulário mostra "Limite de 200 projetos atingido. Remova um projeto para criar outro." A edição continua funcionando.
5. Criações simultâneas não passam do teto.
6. Todas as respostas têm a CSP e os demais headers de segurança, e a aplicação funciona sem nenhuma violação da CSP.
7. A produção envia `Strict-Transport-Security` e não informa a versão do nginx.

## Textos sem design

| Situação | Texto |
|---|---|
| Teto de projetos atingido | "Limite de 200 projetos atingido. Remova um projeto para criar outro." |

## Decisões relacionadas

- [ADR-0035: Proteção contra abuso](../adrs/0035-protecao-contra-abuso.md)
- [ADR-0013: Sem login e com dados compartilhados](../adrs/0013-sem-login-e-com-dados-compartilhados.md)
- [ADR-0018: Hospedagem em uma VM com Docker Compose](../adrs/0018-hospedagem-em-uma-vm-com-docker-compose.md)
