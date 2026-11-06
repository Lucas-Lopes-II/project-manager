# ADR-0032: Busca por nome no banco, enquanto a pessoa digita

- **Status**: Accepted
- **Data**: 2026-11-05
- **Feature**: F11

## Contexto e problema

O Figma tem uma barra de busca com o texto "Digite o nome do projeto..." e uma tela própria de resultado. A busca é só pelo nome. Quem busca pode não digitar acentos nem maiúsculas, e o nome pode ter caracteres especiais. Também é preciso definir quando a busca roda e como ela convive com o histórico do navegador.

## Drivers da decisão

- Encontrar "Área Norte" ao digitar "area".
- Resposta fluida, sem uma requisição por tecla.
- Tratar o texto digitado sempre como texto, inclusive `%` e `_`.
- Seguir o padrão de filtros na API do [ADR-0028](0028-filtros-da-listagem-na-api.md).

## Decisão

1. `GET /api/v1/projects?q=` filtra os projetos cujo nome contém o termo, sem diferenciar maiúsculas e acentos, com a extensão `unaccent` e `ILIKE`. Os caracteres `%`, `_` e `\` do termo são escapados, e espaços repetidos viram um só.
2. A tela de resultado fica em `/busca?q=`, em ordem alfabética, sem toggle, select ou total, como no Figma.
3. A busca roda a partir de 3 caracteres, 300 ms depois da última tecla, e uma busca em andamento é cancelada pela seguinte. O Enter busca na hora.
4. Ao chegar a 3 caracteres na lista, a tela de resultado é aberta com uma nova entrada no histórico do navegador. Os termos seguintes substituem essa entrada, e "Voltar" ou o botão do navegador voltam à lista com os filtros que estavam.

## Alternativas consideradas

- **Busca de texto completo do PostgreSQL:** é feita para frases, e reduzir as palavras ao radical atrapalha a busca por partes de nomes.
- **Índice de trigramas (`pg_trgm`):** acelera buscas por partes do texto em tabelas grandes, mas não se justifica com o volume esperado. Fica como evolução.
- **Buscar no navegador:** dispensaria requisições, mas dividiria as regras da lista entre o navegador e o banco.
- **Buscar só no Enter:** é mais simples, mas a resposta fica menos fluida do que o design sugere.

## Consequências

- A busca não depende de acentos nem de maiúsculas, e qualquer texto digitado é seguro.
- Cada termo de 3 ou mais caracteres faz uma requisição, no máximo uma a cada 300 ms.
- A consulta percorre a tabela inteira, sem índice, o que é aceitável para o volume esperado.
- A extensão `unaccent` precisa estar disponível no PostgreSQL, como está na imagem oficial.
