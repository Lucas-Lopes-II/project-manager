# F11: Busca por nome

## Objetivo

Buscar projetos pelo nome, com a barra e a tela de resultado do Figma.

## Escopo

- API: parâmetro `q` na listagem, sem diferenciar maiúsculas e acentos ([ADR-0032](../adrs/0032-busca-por-nome.md)).
- Barra de busca no cabeçalho, aberta pela lupa.
- Tela de resultado em `/busca?q=`, com "Voltar" e "Resultado da busca".
- Estados de termo curto, de resultado vazio, de carregamento e de erro.
- Testes da API com banco real, testes de unidade e testes E2E.
- OpenAPI e README atualizados.

## Fora do escopo

- Histórico das últimas buscas (F12).
- Destaque do termo no nome do projeto (F13).

## Critérios de aceite

1. A lupa troca o cabeçalho pela barra do Figma, com o foco no campo.
2. A partir de 3 caracteres, a tela de resultado mostra os projetos cujo nome contém o termo, sem diferenciar maiúsculas e acentos.
3. A busca espera 300 ms depois da última tecla, cancela a anterior e roda na hora com Enter.
4. A tela de resultado funciona por link direto e ao recarregar, e "Voltar" e o botão do navegador voltam à lista com os filtros que estavam.
5. Os cards do resultado têm a estrela, o editar e o remover, como na lista.
6. Com menos de 3 caracteres, aparece "Digite ao menos 3 caracteres para buscar." Sem resultado, aparece "Nenhum projeto encontrado" e "Tente buscar por outro nome."
7. Na lista, Esc ou um clique fora fecham a barra vazia. Na tela de resultado, a barra continua aberta com o termo.
8. A barra e a tela de resultado reproduzem o Figma na largura do design, e não há rolagem horizontal em 1366, 1440 e 1920 px.

## Textos sem design

| Situação | Texto |
|---|---|
| Termo curto | "Digite ao menos 3 caracteres para buscar." |
| Sem resultado | "Nenhum projeto encontrado" e "Tente buscar por outro nome." |
| Falha ao buscar | O mesmo erro da listagem, "Não foi possível carregar os projetos.", com "Tentar novamente" |

## Decisões relacionadas

- [ADR-0032: Busca por nome no banco, enquanto a pessoa digita](../adrs/0032-busca-por-nome.md)
- [ADR-0028: Filtros da listagem na API, com o estado na URL](../adrs/0028-filtros-da-listagem-na-api.md)
