# ADR-0010: Migrations com goose

- **Status**: Accepted
- **Data**: 2026-11-04
- **Feature**: F2

## Contexto e problema

O esquema do banco precisa evoluir junto com o código e estar pronto tanto em um ambiente recém-clonado quanto em produção, sem passos manuais.

## Drivers da decisão

- Nenhum passo manual para deixar o banco pronto.
- Migrations em SQL, revisadas junto com o código.
- Segurança quando mais de uma instância inicia ao mesmo tempo.

## Decisão

1. As migrations são arquivos SQL em `api/internal/database/migrations/`, embutidos no binário com `embed`.
2. O `goose` é usado como biblioteca, e a API aplica as migrations pendentes ao iniciar, antes de abrir a porta.
3. Um advisory lock do PostgreSQL impede que duas instâncias apliquem migrations ao mesmo tempo.

## Alternativas consideradas

- **golang-migrate:** é equivalente em recursos, mas uma falha deixa o banco marcado como `dirty` e exige intervenção manual. O `goose` executa cada migration em uma transação.
- **Flyway:** é maduro, mas exige Java ou um container separado em um projeto em Go.
- **Atlas:** compara esquemas e gera migrations, o que vai além do necessário aqui.
- **Etapa separada no deploy:** isola a mudança de esquema do início da aplicação, o que é mais seguro em sistemas maiores, mas exige configurar um job na hospedagem.

## Consequências

- Clonar o projeto e subir o Compose já deixa o banco pronto, e o deploy não tem passo extra.
- Se o banco estiver fora do ar no início, a API encerra com erro em vez de atender sem esquema. Depois de iniciada, ela continua no ar se o banco cair, e `/ready` informa a indisponibilidade.
- Cada início consulta o banco, o que acrescenta um pequeno tempo ao cold start.
- Uma migration demorada atrasaria o início da API, o que não se espera neste projeto.
