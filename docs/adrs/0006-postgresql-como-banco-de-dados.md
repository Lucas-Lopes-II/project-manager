# ADR-0006: PostgreSQL como banco de dados

- **Status**: Accepted
- **Data**: 2026-11-04
- **Feature**: F1

## Contexto e problema

Os projetos têm campos fixos e datas, e a listagem precisa ordenar e buscar nomes em português, tratando "Área" e "area" como equivalentes. O banco também precisa funcionar em produção sem custo. O Compose da F0 já usa PostgreSQL, e este ADR registra o motivo.

## Drivers da decisão

- Suporte a ordenação e busca sem diferenciar acentos e maiúsculas.
- Tipo próprio para datas sem horário.
- Disponibilidade de um serviço gerenciado gratuito.

## Decisão

Usar PostgreSQL 17, com a extensão `unaccent` e collations ICU para os nomes em português. Em desenvolvimento, o banco roda no Compose.

## Alternativas consideradas

- **MySQL:** também atenderia, inclusive com collations sem diferença de acentos, mas não traria vantagem para este caso.
- **SQLite:** é o mais simples de operar, mas depende de um disco persistente, que as hospedagens gratuitas não oferecem.
- **MongoDB:** o modelo de documentos não traz ganho para dados com campos fixos.

## Consequências

- A busca e a ordenação com acentos ficam resolvidas no próprio banco.
- O SQL usa recursos específicos do PostgreSQL, então uma troca de banco exigiria reescrevê-lo.
- A produção precisa de um serviço compatível com as mesmas extensões, o que será verificado na escolha da hospedagem.
