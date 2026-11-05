# ADR-0026: Modal com o elemento `<dialog>` nativo

- **Status**: Accepted
- **Data**: 2026-11-05
- **Feature**: F8

## Contexto e problema

A remoção de um projeto pede confirmação em um modal, como no Figma. Um modal precisa prender o foco dentro dele, fechar com Esc, impedir o uso da página por trás e ser anunciado a leitores de tela como uma caixa de diálogo. O projeto não usa biblioteca de componentes ([ADR-0014](0014-css-moderno-com-tokens.md)).

## Drivers da decisão

- Acessibilidade correta por padrão.
- Pouco código próprio para manter.
- Nenhuma dependência para um único modal.
- Fidelidade ao fundo escurecido e desfocado do Figma.

## Decisão

1. O modal usa o elemento `<dialog>`, aberto com `showModal()`.
2. O navegador prende o foco, trata o Esc, torna a página por trás inerte e devolve o foco ao fechar. O fundo do Figma é aplicado em `::backdrop`.
3. Um clique fora do modal também cancela, porque cancelar é sempre seguro.
4. Enquanto a remoção está em andamento, o modal não fecha e os botões ficam desabilitados.

## Alternativas consideradas

- **Modal próprio, com `div` e `Teleport`:** dá controle total, mas exige recriar a prisão de foco, o Esc, o bloqueio da página e os atributos de acessibilidade.
- **Biblioteca de modal ou de componentes:** resolve tudo isso, mas acrescenta uma dependência para um único modal e um visual que precisaria ser desfeito.

## Consequências

- O comportamento de acessibilidade vem do navegador, com pouco código.
- `<dialog>` e `showModal()` estão em todos os navegadores atuais. O jsdom não implementa `showModal()`, então os testes de unidade usam uma versão mínima, e o comportamento real fica com os testes E2E.
