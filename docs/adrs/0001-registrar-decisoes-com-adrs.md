# ADR-0001: Registrar decisões com ADRs

- **Status**: Accepted
- **Data**: 2026-11-04
- **Feature**: F0

## Contexto e problema

O código e o histórico de commits mostram o que foi feito, mas não explicam por que uma opção foi escolhida nem quais alternativas foram descartadas. Quem lê o projeto depois precisa dessa informação sem depender de quem o escreveu.

## Drivers da decisão

- Manter o motivo de cada decisão junto do código que ela afeta.
- Permitir a leitura rápida, decisão por decisão.
- Ter um custo de escrita baixo, para o registro não ser abandonado.

## Decisão

Registrar as decisões em `docs/adrs/`, um arquivo `NNNN-titulo.md` por decisão, seguindo estas regras:

1. Toda decisão com uma alternativa real vira um ADR.
2. O ADR é escrito antes do código que a decisão afeta.
3. O status começa em `Proposed` e passa a `Accepted` depois da revisão.
4. Um ADR aceito não é reescrito. Se a decisão mudar, um novo ADR a substitui e o anterior passa a `Superseded by ADR-NNNN`.
5. O índice em `docs/adrs/README.md` lista todos os ADRs.

## Alternativas consideradas

- **Seção de decisões no README:** cresce sem limite, mistura decisões com instruções de uso e perde o histórico de cada decisão.
- **Wiki do GitHub:** fica fora do repositório e não é revisada no mesmo pull request que o código.
- **Comentários no código:** servem para detalhes locais, mas não para decisões que atravessam vários arquivos.
- **RFC seguida de ADRs:** uma RFC faz sentido quando um grupo precisa aprovar a proposta. Aqui, o documento de cada feature em `docs/features/` já descreve o que será feito.

## Consequências

- Cada decisão tem contexto e alternativas registrados, e o pull request mostra a decisão junto da implementação.
- Escrever os ADRs adiciona um passo antes de cada feature.
- A regra da alternativa real evita registrar detalhes sem importância, mas depende de bom senso a cada caso.
