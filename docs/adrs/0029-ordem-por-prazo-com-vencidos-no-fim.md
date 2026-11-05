# ADR-0029: Ordem por prazo, com os vencidos no fim

- **Status**: Accepted
- **Data**: 2026-11-05
- **Feature**: F10

## Contexto e problema

O select de ordenação do Figma tem três opções: "Ordem alfabética", "Iniciados mais recentes" e "Prazo mais próximo". O design não diz onde ficam os projetos cujo prazo já passou, nem qual é o "hoje" usado para comparar. As datas não têm horário ([ADR-0011](0011-datas-sem-horario.md)), e quem usa a aplicação está no Brasil.

## Drivers da decisão

- Mostrar primeiro o que ainda precisa de atenção.
- Uma ordem estável, que não muda entre duas buscas iguais.
- Um "hoje" que corresponda ao dia de quem usa a aplicação.

## Decisão

1. `GET /api/v1/projects?sort=` aceita `name` (o padrão), `recent` e `deadline`. Um valor desconhecido responde 400.
2. `name` ordena pelo nome, sem diferenciar maiúsculas e acentos, com a collation `pt-BR-x-icu`.
3. `recent` ordena pela data de início, da mais recente para a mais antiga.
4. `deadline` mostra primeiro os prazos de hoje em diante, do mais próximo para o mais distante, e depois os vencidos, do que venceu mais recentemente para o mais antigo.
5. "Hoje" é a data atual em `America/Sao_Paulo`, calculada no banco.
6. Os empates são desfeitos pelo nome e, por fim, pelo id.

## Alternativas consideradas

- **Prazo em ordem crescente simples:** é a leitura literal de "mais próximo", mas um projeto vencido há meses apareceria no topo.
- **Vencidos fora da ordenação:** esconderia projetos que ainda existem, sem que o design peça isso.
- **"Hoje" em UTC:** depois das 21h no horário de Brasília, o dia seguinte já seria considerado hoje.

## Consequências

- O topo da lista mostra o que vence primeiro, e os vencidos continuam visíveis no fim.
- A ordem por prazo depende do dia, então pode mudar à meia-noite de Brasília sem nenhuma alteração nos dados.
- O fuso fica fixo no código. Uma aplicação com usuários em outros fusos precisaria receber o fuso de quem usa.
