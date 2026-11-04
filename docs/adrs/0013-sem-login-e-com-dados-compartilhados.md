# ADR-0013: Sem login e com dados compartilhados

- **Status**: Accepted
- **Data**: 2026-11-04
- **Feature**: F2

## Contexto e problema

O desafio e o design não preveem login, e a aplicação será publicada em um link aberto. Todas as pessoas que abrirem o link usam a mesma API, e a primeira tela esperada é a listagem vazia.

## Drivers da decisão

- Seguir o escopo do desafio e do design.
- Mostrar a listagem vazia no primeiro acesso.
- Não adicionar complexidade fora do que foi pedido.

## Decisão

1. A API não tem autenticação, e há um único conjunto de dados, compartilhado.
2. A produção não recebe dados de exemplo, e o banco é limpo antes da entrega.
3. A API limita o tamanho do corpo das requisições, e a hospedagem limita o número de instâncias, para reduzir o impacto de uso indevido.

## Alternativas consideradas

- **Login:** daria a cada pessoa os seus dados, mas exige telas e fluxos que não estão no design nem no escopo.
- **Dados isolados por navegador, com um identificador anônimo:** cada pessoa sempre veria a listagem vazia, mas toda consulta passaria a depender desse identificador, sem que o desafio peça isso.

## Consequências

- O código fica mais simples, e o acesso não exige cadastro.
- Quem abrir o link depois de outra pessoa verá os projetos que ela criou, e não a listagem vazia. Remover os projetos traz essa tela de volta.
- Qualquer pessoa pode alterar ou remover os dados, o que é aceitável aqui, mas não em um produto real.
- Em um produto real, a autenticação seria o primeiro passo, e os projetos passariam a pertencer a um usuário.
