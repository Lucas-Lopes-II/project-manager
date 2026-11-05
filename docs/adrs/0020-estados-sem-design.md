# ADR-0020: Estados sem design

- **Status**: Accepted
- **Data**: 2026-11-05
- **Feature**: F5

## Contexto e problema

O Figma não define as telas de carregamento, de erro da API, de zero favoritos, de busca sem resultado e de projeto inexistente. A aplicação passa por esses estados, e uma tela em branco ou a lista vazia no lugar deles levaria a pessoa a conclusões erradas, como achar que os projetos sumiram.

## Drivers da decisão

- Não inventar uma identidade visual que o design não tem.
- Nunca mostrar "Nenhum projeto" antes de saber que a lista está vazia.
- Dar uma saída quando algo falha.
- Anunciar as mudanças de estado a leitores de tela.

## Decisão

1. Os estados usam apenas os tokens e os padrões visuais que já existem no Figma.
2. **Carregamento:** um texto discreto, "Carregando projetos...", com `role="status"`. Ele só aparece depois de 300 ms, para não piscar em respostas rápidas.
3. **Erro da API:** a mensagem "Não foi possível carregar os projetos." e o botão "Tentar novamente", com `role="alert"`. Detalhes técnicos não aparecem na tela.
4. **Zero favoritos, busca sem resultado e projeto inexistente:** seguem o padrão do card de lista vazia, com os textos definidos nas features F9, F11 e F7.

## Alternativas consideradas

- **Skeleton de cards:** reduz a sensação de espera, mas cria um visual que não está no Figma e precisaria acompanhar cada mudança no card.
- **Spinner:** é mais curto de implementar, mas também acrescenta um elemento fora do design e não diz o que está acontecendo.
- **Toast para os erros:** não ocupa a tela, mas não existe no design, desaparece sozinho e deixaria a página sem conteúdo depois de sumir.
- **Tela em branco até a resposta:** não exige nada novo, mas não diferencia uma espera de uma falha.

## Consequências

- Os estados ficam simples e coerentes com o restante da aplicação, e um design futuro pode substituí-los sem mudar a store.
- O carregamento é menos elaborado do que um skeleton. Na produção, a API responde em cerca de 150 ms, então o texto raramente aparece.
- O botão de tentar de novo exige que a busca possa ser repetida pela store.
