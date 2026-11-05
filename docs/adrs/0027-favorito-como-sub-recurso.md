# ADR-0027: Favorito como sub-recurso do projeto

- **Status**: Accepted
- **Data**: 2026-11-05
- **Feature**: F9

## Contexto e problema

A estrela do card marca e desmarca um projeto como favorito, com um clique. O contrato de projetos só tem a edição completa, em `PUT /api/v1/projects/{id}` ([ADR-0009](0009-contrato-rest-de-projetos.md)), que exige todos os campos. É preciso definir como a API recebe só essa mudança.

## Drivers da decisão

- Mudar o favorito sem enviar os demais campos do projeto.
- Repetir a chamada sem efeito colateral, porque a estrela pode ser clicada mais de uma vez ou a requisição pode ser repetida.
- Manter as regras do contrato simples.

## Decisão

1. `PUT /api/v1/projects/{id}/favorite` marca o projeto como favorito, e `DELETE` na mesma rota desmarca. As duas respondem 204.
2. Repetir qualquer uma das duas dá o mesmo resultado.
3. O projeto passa a ter o campo `favorite`, que começa como `false`, e a edição completa não o altera.
4. Marcar ou desmarcar não muda o `updated_at`, porque não altera os dados do projeto.

## Alternativas consideradas

- **`PATCH /api/v1/projects/{id}` com `{"favorite": true}`:** é o caminho comum para alterações parciais, mas abre regras de mesclagem de campos que o resto da API não tem e convida a usar `PATCH` para qualquer campo.
- **Favorito na edição completa:** dispensa uma rota, mas obriga a enviar o projeto inteiro para mudar um campo, e uma edição feita em outra aba poderia ser desfeita pelo clique na estrela.
- **`POST` para alternar o estado:** usa uma única rota, mas repetir a chamada inverte o resultado.

## Consequências

- O front-end troca o estado com uma requisição curta, sem conhecer os demais campos.
- A API passa a ter um sub-recurso além da capa, no mesmo padrão de `/projects/{id}/...`.
- O `updated_at` continua indicando a última edição dos dados.
