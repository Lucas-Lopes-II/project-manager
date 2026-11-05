# F10: Ordenação

## Objetivo

Ordenar a listagem pelos três critérios do Figma, com um select próprio e acessível, e reduzir a queda durante as publicações.

## Escopo

- API: parâmetro `sort` na listagem, com `name`, `recent` e `deadline` ([ADR-0029](../adrs/0029-ordem-por-prazo-com-vencidos-no-fim.md)).
- Select de ordenação na barra da listagem, fechado e aberto como no Figma ([ADR-0030](../adrs/0030-select-proprio-acessivel.md)).
- Ordem na URL, como o filtro de favoritos ([ADR-0028](../adrs/0028-filtros-da-listagem-na-api.md)).
- Healthchecks mais rápidos na subida, prazo curto de conexão do nginx com a API, novas tentativas no Caddy e recarga do Caddy na VM quando o Caddyfile muda ([ADR-0031](../adrs/0031-publicacao-com-espera-no-lugar-do-erro.md)).
- Testes da API com banco real, testes de unidade e testes E2E.
- OpenAPI e README atualizados.

## Fora do escopo

- Busca por nome (F11).
- Mais de uma instância da API ([ADR-0031](../adrs/0031-publicacao-com-espera-no-lugar-do-erro.md)).

## Critérios de aceite

1. "Ordem alfabética" é o padrão e ignora maiúsculas e acentos.
2. "Iniciados mais recentes" ordena pela data de início, da mais recente para a mais antiga.
3. "Prazo mais próximo" mostra primeiro os prazos de hoje em diante, do mais próximo ao mais distante, e depois os vencidos, do mais recente ao mais antigo, com o "hoje" de Brasília.
4. A ordem combina com o filtro de favoritos, e o total continua contando todos os projetos.
5. A ordem fica na URL, sobrevive ao recarregar a página e é mantida ao voltar dos formulários.
6. O select funciona pelo teclado como o padrão da WAI-ARIA e informa a opção a leitores de tela.
7. O select fechado e aberto reproduz o Figma na largura do design, e não há rolagem horizontal em 1366, 1440 e 1920 px.
8. Em uma publicação, a página não responde erro, e a API responde erro por no máximo cerca de 2 segundos, medidos pelo monitor.

## Ajustes em relação ao Figma

- **Seta do select:** foi desenhada a partir das medidas do Figma, com 16 × 8,69 px e a cor #717171, porque a exportação do ícone falhou.

## Decisões relacionadas

- [ADR-0029: Ordem por prazo, com os vencidos no fim](../adrs/0029-ordem-por-prazo-com-vencidos-no-fim.md)
- [ADR-0030: Select próprio e acessível](../adrs/0030-select-proprio-acessivel.md)
- [ADR-0031: Publicação com espera no lugar do erro](../adrs/0031-publicacao-com-espera-no-lugar-do-erro.md)
