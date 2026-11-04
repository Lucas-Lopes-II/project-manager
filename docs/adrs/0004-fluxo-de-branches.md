# ADR-0004: Fluxo de branches com pull requests

- **Status**: Accepted
- **Data**: 2026-11-04
- **Feature**: F1

## Contexto e problema

O projeto precisa de um fluxo de branches que mantenha o histórico legível e permita publicar cada feature assim que ela fica pronta.

## Drivers da decisão

- Passar toda mudança pelo CI antes de chegar à `main`.
- Manter a `main` fácil de ler, com uma entrada por feature.
- Não adicionar etapas que o projeto não usa.

## Decisão

1. A `main` fica sempre em condição de deploy.
2. Cada feature tem uma branch `feat/NN-nome`, criada a partir da `main`.
3. As mudanças entram por pull request, com o CI aprovado.
4. Dentro do pull request, os commits são pequenos e seguem o padrão Conventional Commits.
5. O merge é feito com squash: o título do pull request vira o commit na `main`.

## Alternativas consideradas

- **Gitflow, com `develop` e branches de release:** faz sentido quando várias versões convivem ou quando há releases programadas. Aqui, com deploy contínuo e uma única versão, seria uma etapa a mais sem benefício.
- **Merge commit:** mantém todos os commits na `main`, mas deixa o histórico mais longo, e os passos de cada feature já ficam disponíveis na página do pull request.
- **Rebase merge:** preserva os commits, mas perde o limite de cada feature e reescreve os commits.
- **Commits direto na `main`:** é o mais rápido, mas o código chega à `main` sem passar pelo CI.

## Consequências

- `git log` mostra uma entrada por feature, e a página de cada pull request guarda os passos.
- Os commits na `main` ficam maiores, então `git blame` e `git bisect` apontam para a feature inteira, não para um passo.
- O título do pull request precisa descrever bem a feature, porque vira a mensagem do commit.
- Se o projeto passar a ter releases programadas, este fluxo precisará ser revisto.
