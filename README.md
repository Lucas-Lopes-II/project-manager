# Gerenciador de Projetos

[![CI](https://github.com/Lucas-Lopes-II/project-manager/actions/workflows/ci.yml/badge.svg)](https://github.com/Lucas-Lopes-II/project-manager/actions/workflows/ci.yml)

Aplicação para visualizar, adicionar, editar, remover e favoritar projetos, feita a partir do design do Figma, com o front-end em Vue e a API em Go.

- **Acesse:** https://gerenciador-projetos-lucas.duckdns.org
- **Decisões técnicas:** [docs/adrs](docs/adrs/README.md)

## O que a aplicação faz

- Lista os projetos em cards, com o total cadastrado, o filtro "Apenas Favoritos" e três ordenações: alfabética, iniciados mais recentes e prazo mais próximo. O filtro e a ordem ficam no endereço da página.
- Cria, edita e remove projetos, com as validações do design e uma capa opcional em JPEG ou PNG.
- Busca por nome enquanto a pessoa digita, sem diferenciar maiúsculas e acentos, com o histórico das últimas 5 buscas e o termo destacado nos resultados.
- Trata os estados que o design não mostra: carregamento, erro da API, nenhum favorito, busca sem resultado e projeto inexistente.
- Funciona em celulares e tablets, e a acessibilidade, no nível WCAG 2.1 AA, é verificada nos testes E2E.
- Em produção, limita as requisições por IP e o número de projetos, e envia os headers de segurança do navegador.

## Stack

- **Front-end:** Vue 3, TypeScript, Pinia e Vite
- **API:** Go, com `net/http` e `pgx`
- **Banco de dados:** PostgreSQL 17
- **Testes:** Go com banco real, Vitest e Cypress
- **Infraestrutura:** Docker Compose, GitHub Actions e uma VM na AWS com Caddy

## Decisões principais

As 37 decisões estão registradas como ADRs, no [índice](docs/adrs/README.md), e cada feature tem o seu escopo e os seus critérios de aceite em [docs/features](docs/features/). Para começar:

| Tema | Decisões |
|---|---|
| Front-end | [Vue 3 com TypeScript](docs/adrs/0003-vue-3-no-front-end.md), [organização por feature](docs/adrs/0015-organizacao-do-front-end-por-feature.md) e [CSS com os tokens do design](docs/adrs/0014-css-moderno-com-tokens.md) |
| API | [Camadas e pacotes em Go](docs/adrs/0005-arquitetura-da-api-em-go.md), [contrato REST](docs/adrs/0009-contrato-rest-de-projetos.md) e [erros no formato da RFC 9457](docs/adrs/0007-contrato-de-erros-da-api.md) |
| Regras do design | [Validações de projeto](docs/adrs/0012-regras-de-validacao-de-projetos.md), [estados sem design](docs/adrs/0020-estados-sem-design.md) e [filtros no endereço da página](docs/adrs/0028-filtros-da-listagem-na-api.md) |
| Dados | [Sem login, com dados compartilhados](docs/adrs/0013-sem-login-e-com-dados-compartilhados.md), [capas no PostgreSQL](docs/adrs/0022-capas-no-postgresql.md) e [busca no banco](docs/adrs/0032-busca-por-nome.md) |
| Qualidade | [Testes com banco real](docs/adrs/0008-testes-de-integracao-com-banco-real.md), [E2E contra a aplicação real](docs/adrs/0021-testes-e2e-com-cypress.md) e [acessibilidade verificada](docs/adrs/0037-acessibilidade-verificada-e-anuncio-de-tela.md) |
| Produção | [Uma VM com Docker Compose](docs/adrs/0018-hospedagem-em-uma-vm-com-docker-compose.md), [publicação por imagens](docs/adrs/0019-publicacao-por-imagens-com-atualizacao-pela-vm.md) e [proteção contra abuso](docs/adrs/0035-protecao-contra-abuso.md) |

## Ajustes em relação ao Figma

A aplicação segue os 11 quadros do Figma, conferidos lado a lado na largura do design, de 1940 px. Estes são os pontos em que ela difere de propósito:

- **Regras de validação:** o quadro de validações é ilustrativo, e as regras aplicadas estão no [ADR-0012](docs/adrs/0012-regras-de-validacao-de-projetos.md).
- **Formulário:** no Figma, os campos variam entre 702 e 704 px de largura e entre 4 e 8 px nos cantos. Aqui, todos ficam na mesma coluna, com cantos de 8 px ([F6](docs/features/06-criar-projeto.md)).
- **Textos longos no card:** o nome e o cliente ficam em uma linha, com reticências e o texto completo ao passar o mouse ([F6](docs/features/06-criar-projeto.md)).
- **Modal de remoção:** o ícone fica centralizado, e a posição acompanha a altura da tela ([F8](docs/features/08-remover-projeto.md)).
- **Seta do select:** foi desenhada a partir das medidas do Figma, porque a exportação do ícone falhou ([F10](docs/features/10-ordenacao.md)).
- **Barra de busca:** não muda de lugar quando o histórico aparece, e o contorno com o histórico só arredonda os cantos de baixo, porque encosta no topo da janela ([F12](docs/features/12-historico-de-busca.md)).
- **Cinza dos textos secundários:** `#6E6E6E` no lugar de `#717171`, para atingir o contraste do nível AA ([F15](docs/features/15-acessibilidade-e-telas-menores.md)).
- **Telas menores que o design:** margens de 16 px no celular e duas colunas no tablet ([ADR-0036](docs/adrs/0036-telas-menores-que-o-design.md)).

## Limitações conhecidas

- **Sem login:** quem tem o link vê e altera os mesmos dados ([ADR-0013](docs/adrs/0013-sem-login-e-com-dados-compartilhados.md)). Em um produto real, a autenticação viria primeiro.
- **Até 200 projetos:** é um teto contra abuso na aplicação pública ([ADR-0035](docs/adrs/0035-protecao-contra-abuso.md)). A listagem não é paginada, porque o design mostra todos os projetos em uma grade ([ADR-0009](docs/adrs/0009-contrato-rest-de-projetos.md)).
- **Uma VM, sem réplica nem backup:** os dados são de avaliação ([ADR-0018](docs/adrs/0018-hospedagem-em-uma-vm-com-docker-compose.md)).
- **Capas no banco:** em um volume maior, iriam para um armazenamento de objetos, sem mudar o front-end ([ADR-0022](docs/adrs/0022-capas-no-postgresql.md)).
- **Leitor de tela:** a acessibilidade foi verificada com o axe e com o teclado, mas não com um leitor de tela real ([ADR-0037](docs/adrs/0037-acessibilidade-verificada-e-anuncio-de-tela.md)).

## Como rodar

É preciso ter o Docker com o Compose instalado.

```bash
cp .env.example .env
docker compose up -d --wait --build
```

O comando termina quando tudo está pronto. A aplicação fica em `http://localhost:3000` e a API em `http://localhost:8080`.

Se alguma das portas 3000, 5432 ou 8080 estiver ocupada, altere `WEB_PORT`, `POSTGRES_PORT` ou `API_PORT` no `.env`.

A lista começa vazia. Para ver a aplicação com 8 projetos de exemplo, com favoritos e capas, rode o script abaixo, que precisa do Bash e do curl. Se a API estiver em outra porta, informe o endereço, como em `scripts/seed-demo.sh http://localhost:8081`.

```bash
scripts/seed-demo.sh
```

Para parar o ambiente:

```bash
docker compose down     # mantém os dados
docker compose down -v  # apaga os dados
```

## API

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/v1/projects` | Lista os projetos, com os filtros `favorite`, `q` e `sort` |
| `POST` | `/api/v1/projects` | Cria um projeto |
| `GET` | `/api/v1/projects/{id}` | Consulta um projeto |
| `PUT` | `/api/v1/projects/{id}` | Substitui os campos de um projeto |
| `DELETE` | `/api/v1/projects/{id}` | Remove um projeto |
| `GET` | `/api/v1/projects/{id}/cover` | Retorna a capa de um projeto |
| `PUT` | `/api/v1/projects/{id}/favorite` | Marca um projeto como favorito |
| `DELETE` | `/api/v1/projects/{id}/favorite` | Desmarca um projeto como favorito |

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

Como ela é pública e sem login, o nginx limita as requisições por IP, a API aceita até 200 projetos e as respostas trazem os headers de segurança do navegador ([ADR-0035](docs/adrs/0035-protecao-contra-abuso.md)).

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
scripts/            dados de exemplo para o ambiente local
compose.yaml        ambiente local
compose.prod.yaml   produção
deploy/             configuração e scripts da VM
```

## Documentação

- [Decisões técnicas (ADRs)](docs/adrs/README.md)
- [Features](docs/features/)
- [Contrato da API (OpenAPI)](docs/openapi.yaml)
- [Deploy](docs/deploy.md)
