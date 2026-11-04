# ADR-0016: Estado com Pinia e cliente HTTP com fetch

- **Status**: Accepted
- **Data**: 2026-11-04
- **Feature**: F3

## Contexto e problema

A listagem, o favorito e o modal de remoção alteram os mesmos dados, e a busca precisa cancelar requisições antigas. É preciso definir onde esse estado fica e como o front-end conversa com a API.

## Drivers da decisão

- Um único lugar para os dados compartilhados entre telas.
- Tratamento uniforme dos erros da API ([ADR-0007](0007-contrato-de-erros-da-api.md)).
- Suporte a cancelamento de requisições.
- Usar o que é padrão no ecossistema Vue.

## Decisão

1. **Dados compartilhados:** ficam em uma store do Pinia, escrita no formato de setup, com `ref` e `computed`.
2. **Estado de um único componente:** fica no próprio componente, como os campos de um formulário.
3. **Lógica reutilizável sem estado compartilhado:** fica em composables.
4. **HTTP:** um cliente próprio sobre `fetch` aceita `AbortSignal` e converte as respostas de erro em um `ApiError` tipado, com o status e os campos inválidos.

## Alternativas consideradas

- **TanStack Query:** resolve bem cache, novas tentativas e estados de carregamento, mas é mais um conceito para uma aplicação com um único recurso e poucas telas.
- **Composables com estado global:** funcionam sem dependência, mas não têm o suporte do Vue Devtools e criam um padrão próprio para o que o Pinia já oferece.
- **axios:** adiciona interceptors e cancelamento, que `fetch` e `AbortController` cobrem com uma dependência a menos.

## Consequências

- Listagem, favorito e remoção usam os mesmos dados, e as atualizações otimistas ficam em um único lugar.
- O cache e a revalidação dos dados são escritos à mão, no que for necessário.
- O cliente HTTP é código próprio e precisa de testes.
