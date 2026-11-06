# F15: Acessibilidade, telas menores e comparação final com o Figma

## Objetivo

Verificar a acessibilidade de todas as telas, anunciar cada troca de tela, adaptar a aplicação a celulares e tablets e conferir o resultado final com o Figma.

## Escopo

- Ajustes para telas abaixo de 1024 px ([ADR-0036](../adrs/0036-telas-menores-que-o-design.md)).
- Verificação com o axe nos testes E2E, título da aba por tela e foco na troca de tela ([ADR-0037](../adrs/0037-acessibilidade-verificada-e-anuncio-de-tela.md)).
- Revisão manual com o teclado, com zoom de 200% e com a preferência por menos movimento.
- Comparação final, lado a lado, com os 11 quadros do Figma.
- Correções encontradas nessas revisões.

## Fora do escopo

- Layout próprio para celular, sem base no design.
- Teste com leitores de tela reais.

## Critérios de aceite

1. O axe não encontra violações das regras WCAG 2.1 A e AA em nenhuma tela ou estado testado, inclusive em 375 px.
2. Cada tela tem o seu título na aba do navegador.
3. Ao trocar de tela por um link ou botão, o foco vai para o título da nova tela. Digitando na busca, o foco continua no campo.
4. Em 375, 768 e 1024 px, não há rolagem horizontal, e as margens e a grade seguem o ADR-0036. A partir de 1366 px, o layout não muda.
5. Todos os fluxos funcionam só com o teclado, com o foco sempre visível.
6. Com zoom de 200% em 1366 px, o conteúdo continua legível, sem rolagem horizontal.
7. Com a preferência por menos movimento, as transições ficam desligadas.
8. Os 11 quadros do Figma conferem com a aplicação na largura do design, com os ajustes já registrados nas features anteriores.

## Ajustes em relação ao Figma

- **Cinza dos textos secundários:** o Figma usa `#717171`, que tem contraste de 4,39:1 sobre o fundo lilás da página, abaixo dos 4,5:1 do nível AA. Aqui, ele é `#6E6E6E`, com 4,58:1, sem diferença visível.

## Decisões relacionadas

- [ADR-0036: Telas menores que o design](../adrs/0036-telas-menores-que-o-design.md)
- [ADR-0037: Acessibilidade verificada nos testes e anúncio de cada tela](../adrs/0037-acessibilidade-verificada-e-anuncio-de-tela.md)
