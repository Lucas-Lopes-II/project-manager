# ADR-0011: Datas sem horário

- **Status**: Accepted
- **Data**: 2026-11-04
- **Feature**: F2

## Contexto e problema

Os projetos têm uma data de início e uma data final, sem horário. Tratar esses valores como data e hora pode alterar o dia exibido: no navegador, `new Date("2026-11-04")` é lido como meia-noite em UTC, o que no Brasil ainda é o dia 3.

## Drivers da decisão

- O dia salvo é sempre o dia exibido, em qualquer fuso horário.
- Comparação e ordenação corretas no banco.
- Formato sem dependência de idioma na API.

## Decisão

1. No banco, as datas usam o tipo `DATE`.
2. Na API, as datas trafegam como strings `YYYY-MM-DD`.
3. No front-end, as datas nunca passam por `new Date("YYYY-MM-DD")` para exibição. A formatação em português parte do ano, do mês e do dia.

## Alternativas consideradas

- **`TIMESTAMPTZ`:** é o tipo certo para instantes no tempo, mas aqui adicionaria um horário sem significado e o risco de mudança de dia.
- **Formato brasileiro na API (`DD/MM/YYYY`):** acompanharia a interface, mas prenderia a API a um idioma e não ordenaria como texto.
- **Timestamp numérico:** dificulta a leitura e tem os mesmos problemas de fuso horário.

## Consequências

- Não há conversão de fuso horário em nenhuma camada.
- O Go não tem um tipo nativo para data sem horário, então o projeto precisa de um tipo próprio que converta o formato no JSON.
- O front-end precisa de uma função própria para formatar datas, coberta por testes.
