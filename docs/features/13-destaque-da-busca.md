# F13: Destaque do termo buscado

## Objetivo

Destacar em laranja, no nome dos cards do resultado, o trecho que corresponde ao termo buscado, como no Figma.

## Escopo

- Destaque do termo no nome dos cards da tela de resultado ([ADR-0034](../adrs/0034-destaque-do-termo-no-navegador.md)).
- Correção da recarga do Caddy na VM ([ADR-0031](../adrs/0031-publicacao-com-espera-no-lugar-do-erro.md)).
- Testes de unidade e testes E2E.
- README atualizado.

## Fora do escopo

- Destaque no cliente e na lista de projetos, que o design não mostra.
- Mudanças na API.

## Critérios de aceite

1. Na tela de resultado, o trecho do nome que corresponde ao termo aparece com o fundo laranja do Figma.
2. O destaque não diferencia maiúsculas e acentos e mantém os caracteres originais: buscar "area" destaca "Área".
3. Todas as ocorrências do termo no nome são destacadas.
4. A lista de projetos e o nome do cliente não têm destaque.
5. O nome completo continua no `title` e é lido inteiro por leitores de tela.
6. O destaque reproduz o Figma na largura do design, e não há rolagem horizontal em 1366, 1440 e 1920 px.
7. Depois da publicação desta feature, o Caddy da VM passa a ler o Caddyfile do repositório, e as próximas publicações esperam o `web` novo em vez de responder 502.

## Decisões relacionadas

- [ADR-0034: Destaque do termo calculado no navegador](../adrs/0034-destaque-do-termo-no-navegador.md)
- [ADR-0032: Busca por nome no banco, enquanto a pessoa digita](../adrs/0032-busca-por-nome.md)
- [ADR-0031: Publicação com espera no lugar do erro](../adrs/0031-publicacao-com-espera-no-lugar-do-erro.md)
