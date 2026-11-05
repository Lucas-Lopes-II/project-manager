# ADR-0030: Select próprio e acessível

- **Status**: Accepted
- **Data**: 2026-11-05
- **Feature**: F10

## Contexto e problema

O Figma desenha o select de ordenação fechado e aberto: a lista fica colada ao campo, com a mesma borda roxa, os cantos inferiores arredondados e divisores entre as opções. O `<select>` nativo mostra a lista do sistema operacional, que não pode ser estilizada. O projeto não usa biblioteca de componentes ([ADR-0014](0014-css-moderno-com-tokens.md)).

## Drivers da decisão

- Fidelidade ao estado aberto do Figma.
- Acessibilidade completa pelo teclado e por leitores de tela.
- Nenhuma dependência para um único controle.

## Decisão

1. O componente `BaseSelect` segue o padrão de combobox de seleção única da WAI-ARIA (*select-only combobox*): um elemento com `role="combobox"` controla uma lista com `role="listbox"`, e a opção ativa é indicada por `aria-activedescendant`.
2. O foco fica sempre no combobox. Fechado, Enter, Espaço e as setas abrem a lista. Aberto, as setas, Home e End movem a opção ativa, Enter e Espaço escolhem, Tab escolhe e segue para o próximo controle, e Esc fecha sem mudar nada.
3. Digitar letras leva à primeira opção que começa com elas, sem diferenciar acentos.
4. Um clique fora da lista fecha sem mudar nada.

## Alternativas consideradas

- **`<select>` nativo estilizado:** tem a acessibilidade do navegador, mas só o estado fechado fica igual ao Figma.
- **`<select>` com `appearance: base-select`:** permite estilizar a lista nativa, mas ainda não funciona em todos os navegadores atuais.
- **Biblioteca de componentes acessíveis:** resolve o comportamento, mas acrescenta uma dependência para um único controle.

## Consequências

- O select aberto segue o Figma, com o comportamento de teclado esperado pelo padrão.
- O comportamento é código próprio, coberto por testes de unidade e E2E.
- Em celulares, a lista é a do próprio componente, e não o seletor do sistema.
