# ADR-0015: Organização do front-end por feature

- **Status**: Accepted
- **Data**: 2026-11-04
- **Feature**: F3

## Contexto e problema

O front-end tem poucas telas, todas em torno de projetos, e componentes visuais reutilizados entre elas. A organização das pastas precisa deixar claro onde cada coisa fica, sem criar camadas que o tamanho do projeto não pede.

## Drivers da decisão

- Encontrar rapidamente o código de uma feature.
- Separar o que é do domínio do que é visual e reutilizável.
- Manter o mesmo raciocínio usado na API ([ADR-0005](0005-arquitetura-da-api-em-go.md)).

## Decisão

```text
web/src/
  app/                  layout, rotas e inicialização
  features/projects/    telas, componentes, store e chamadas de projetos
  shared/api/           cliente HTTP
  shared/ui/            componentes visuais sem regra de negócio
  shared/styles/        tokens e estilos globais
  shared/assets/        ícones e imagens
```

- O código de `shared/` não importa nada de `features/`.
- Um componente vai para `shared/ui/` quando não conhece o domínio, como botão, modal e campo de formulário.

## Alternativas consideradas

- **Pastas por tipo (`components/`, `views/`, `stores/`):** é o padrão gerado pelas ferramentas, mas espalha cada feature por várias pastas.
- **Feature-Sliced Design:** define camadas e regras de importação mais rígidas, o que faz sentido em aplicações maiores, mas é excessivo para uma única feature de domínio.

## Consequências

- O código de projetos fica todo no mesmo lugar, e a regra de importação evita dependências circulares.
- Decidir entre `features/` e `shared/` exige algum julgamento a cada componente novo.
- Com uma única feature de domínio, a pasta `features/` parece grande demais hoje, mas evita mudanças se outra feature surgir.
