# F12: Histórico de busca

## Objetivo

Mostrar as últimas buscas abaixo da barra, como no Figma, para repetir uma busca com um clique e remover os termos que não interessam mais.

## Escopo

- Histórico das últimas 5 buscas, guardado no navegador ([ADR-0033](../adrs/0033-historico-de-busca-no-navegador.md)).
- Lista abaixo da barra aberta, com o ícone de histórico, o termo e o X de cada item.
- Testes de unidade e testes E2E.
- README atualizado.

## Fora do escopo

- Destaque do termo no nome do projeto (F13).
- Apagar todo o histórico de uma vez, que não existe no design.
- Guardar o histórico na API ou sincronizá-lo entre aparelhos.

## Critérios de aceite

1. Cada busca que roda, com 3 ou mais caracteres, entra no topo do histórico, que guarda no máximo 5 termos.
2. Digitar "pro", "proj" e "projeto" na mesma busca gera um único item, "projeto". Repetir uma busca a leva para o topo, sem duplicar. Maiúsculas e acentos não contam nessas comparações.
3. A lista aparece com a barra aberta, o foco nela e o campo vazio, na lista de projetos e na tela de resultado, e some quando a pessoa digita.
4. Escolher um termo faz a busca e abre a tela de resultado, com o termo na barra.
5. O X remove só aquele item, sem fechar a barra nem fazer uma busca.
6. O histórico continua depois de recarregar a página. Sem acesso ao `localStorage`, a busca e o histórico funcionam enquanto a página estiver aberta, sem erro.
7. Termos e X são alcançáveis pelo Tab e têm nomes para leitores de tela. Depois de remover um item pelo teclado, o foco vai para o próximo termo, ou para o anterior no fim da lista, ou para o campo se a lista ficar vazia. Esc e o clique fora continuam fechando a barra vazia na lista.
8. A lista reproduz o Figma na largura do design, por cima dos cards, com os ajustes abaixo, e não gera rolagem horizontal em 1366, 1440 e 1920 px.

## Ajustes em relação ao Figma

- **Alinhamento:** no Figma, a barra aberta com o histórico tem a lupa e o texto 8 e 16 px mais à esquerda que a barra preenchida. Aqui, a barra não muda de lugar quando a lista aparece ou some, e os itens seguem o alinhamento dela: o ícone sob a lupa e o termo alinhado ao texto digitado.
- **Cantos superiores:** o contorno roxo encosta no topo da janela, então só os cantos de baixo são arredondados.

## Textos sem design

| Situação | Texto |
|---|---|
| Nome da lista, para leitores de tela | "Buscas recentes" |
| Nome do X, para leitores de tela | "Remover {termo} do histórico" |

## Decisões relacionadas

- [ADR-0033: Histórico de busca no navegador](../adrs/0033-historico-de-busca-no-navegador.md)
- [ADR-0032: Busca por nome no banco, enquanto a pessoa digita](../adrs/0032-busca-por-nome.md)
