# ADR-0036: Telas menores que o design

- **Status**: Accepted
- **Data**: 2026-11-06
- **Feature**: F15

## Contexto e problema

O Figma só tem telas de 1940 px de largura. Até aqui, a aplicação foi conferida em 1366, 1440 e 1920 px, sem rolagem horizontal. Em um celular de 375 px, ela continuava usável, mas com margens de 40 px, pensadas para telas largas. Em um tablet de 768 px, a grade ficava com uma coluna só, e cada card ocupava 688 px, com uma capa enorme.

## Drivers da decisão

- Usar a aplicação em celulares e tablets, no mesmo estilo visual do design.
- Manter a fidelidade ao Figma nas larguras de desktop.
- Poucas regras, sem um segundo layout para manter.

## Decisão

1. Abaixo de 600 px, as margens laterais da página caem de 40 para 16 px, e o espaço acima do conteúdo, de 60 para 24 px. A barra de busca e a lupa do cabeçalho seguem as mesmas margens.
2. Abaixo de 1024 px, a grade aceita cards a partir de 300 px, o que dá duas colunas no tablet. A partir de 1024 px, a largura mínima continua sendo a do design, 346 px.
3. Os demais componentes já se adaptam à largura e continuam como estão.
4. A aplicação é conferida em 375, 768 e 1024 px, além das larguras de desktop, sempre sem rolagem horizontal.

## Alternativas consideradas

- **Layout próprio para celular, com menu e barra inferior:** seria um design novo, sem base no Figma, para um uso que o teste não pede.
- **Largura mínima de 300 px em todas as telas:** daria mais colunas em 1440 e 1920 px, com cards mais próximos dos 346 px do Figma, mas mudaria o layout de desktop já conferido com o design.

## Consequências

- No celular, o conteúdo ganha 48 px de largura, e o card de um projeto ocupa a tela inteira.
- No tablet, os cards ficam com cerca de 330 px, perto dos 346 px do design.
- Os pontos de quebra ficam no CSS dos componentes que mudam, sem uma biblioteca de grade.
