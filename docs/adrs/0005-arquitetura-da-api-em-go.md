# ADR-0005: Arquitetura da API em Go

- **Status**: Accepted
- **Data**: 2026-11-04
- **Feature**: F1

## Contexto e problema

A API gerencia um único recurso, com listagem, filtro, ordenação, busca e upload de imagem. A estrutura precisa ser clara e fácil de testar, sem ir além do que esse escopo pede.

## Drivers da decisão

- Facilidade de leitura.
- Poucas dependências.
- Regras de negócio testáveis sem HTTP e sem banco.
- Estrutura proporcional ao tamanho do problema.

## Decisão

1. **HTTP:** usar `net/http`, com o roteamento por método e caminho do `ServeMux`. Os middlewares são funções pequenas no próprio projeto.
2. **Organização:** um pacote por feature, com a infraestrutura compartilhada em pacotes próprios.
3. **Camadas:** o handler cuida do HTTP, o service das regras e o repository do SQL. Interfaces são declaradas por quem as consome, só onde um teste precisa de um dublê.
4. **Banco:** usar `pgx`, com SQL explícito no repository.
5. **Logs:** usar `log/slog`, em JSON.

```text
api/
  cmd/api/            ponto de entrada e montagem das dependências
  internal/config/    variáveis de ambiente
  internal/database/  pool de conexões
  internal/httpx/     middlewares e respostas de erro
  internal/health/    health checks
  internal/project/   handler, service e repository de projetos (F2)
```

## Alternativas consideradas

- **Gin ou Echo:** aceleram o início, mas prendem os handlers à assinatura e ao contexto do framework, e o `ServeMux` já cobre o roteamento necessário.
- **Chi:** é leve e compatível com `net/http`, mas não traria ganho suficiente para justificar a dependência neste escopo.
- **GORM:** esconde o SQL, e a busca e a ordenação com acentos exigiriam SQL explícito de qualquer forma.
- **sqlc:** gera código com tipos a partir do SQL, mas lida mal com uma listagem que combina filtro e ordenação variáveis, e adiciona uma etapa de geração.
- **Clean Architecture completa, com portas e adaptadores:** é adequada para domínios maiores, mas com um único recurso criaria indireção sem ganho.
- **Pacotes por tipo (`handlers/`, `services/`, `repositories/`):** espalham cada feature por várias pastas.

## Consequências

- O projeto tem poucas dependências, e o código segue os padrões da biblioteca padrão.
- Middlewares e tratamento de JSON são escritos à mão, o que dá um pouco mais de código.
- O SQL só pode ser validado contra um banco real, conforme o [ADR-0008](0008-testes-de-integracao-com-banco-real.md).
- Se o domínio crescer, novas features ganham novos pacotes, sem mudar a estrutura.
