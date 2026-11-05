# ADR-0024: Campos de data nativos, com o visual do design

- **Status**: Accepted
- **Data**: 2026-11-05
- **Feature**: F6

## Contexto e problema

O formulário tem dois campos de data, e o Figma só mostra o campo fechado, com o valor em `dd/mm/aaaa` e um ícone de calendário. O calendário aberto não tem design. O campo precisa ser acessível, funcionar pelo teclado e não ficar com a aparência padrão do navegador.

## Drivers da decisão

- Fidelidade ao campo que o Figma mostra.
- Acessibilidade e uso pelo teclado sem código próprio.
- Nenhuma dependência para o que o navegador já oferece.
- Calendário adequado em cada dispositivo.

## Decisão

1. Os campos usam `<input type="date">`, isolados no componente `DateField`.
2. A borda, a fonte, as medidas e o ícone seguem o Figma. O ícone nativo fica invisível sobre todo o campo, então um clique em qualquer parte abre o calendário.
3. O campo vazio fica em branco, como no Figma, e mostra o formato quando recebe o foco.

## Alternativas consideradas

- **Biblioteca de datepicker:** daria um calendário com o visual do projeto, mas acrescenta uma dependência e peso por um elemento que o design não define.
- **Datepicker próprio:** dá controle total, mas exige recriar a navegação por teclado, a acessibilidade e a experiência em celulares.
- **Campo de texto com máscara:** fica idêntico ao Figma, mas perde o calendário e passa a validar a data à mão.

## Consequências

- O campo fechado segue o design, com pouco código e sem dependências.
- O calendário aberto continua sendo o do navegador. Se ele não for aceitável, basta trocar o `DateField`, sem afetar o restante do formulário.
- A parte da data em edição pelo teclado usa a cor de seleção do sistema. O Chrome ignora o seletor `:focus` nessa parte, e colorir sem ele pintaria o dia, o mês e o ano ao mesmo tempo, sem indicar qual está em edição.
- O formato segue o idioma do navegador, então pode aparecer como `mm/dd/aaaa` em um navegador em inglês.
- O ícone depende de um seletor `::-webkit-*`. Onde ele não existe, como no Firefox, o campo mantém o ícone e o formato do navegador, inclusive quando está vazio.
