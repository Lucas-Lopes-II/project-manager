# ADR-0037: Acessibilidade verificada nos testes e anúncio de cada tela

- **Status**: Accepted
- **Data**: 2026-11-06
- **Feature**: F15

## Contexto e problema

Cada feature cuidou dos rótulos, do teclado e do foco dos seus componentes. Faltava uma verificação que cobrisse todas as telas e não dependesse de revisão manual a cada mudança. Além disso, em uma aplicação de página única, trocar de tela não recarrega a página: o título da aba era sempre o mesmo, e o foco continuava no link clicado, ou se perdia quando o botão saía da tela. Quem usa um leitor de tela não era avisado da nova tela.

## Drivers da decisão

- Encontrar problemas de acessibilidade automaticamente, nos testes que já rodam no CI.
- Anunciar a nova tela, como acontece em uma navegação comum.
- Não tirar o foco de quem está digitando na busca.

## Decisão

1. Os testes E2E verificam cada tela e cada estado relevante com o `axe-core`, nas regras WCAG 2.1 A e AA. Qualquer violação reprova o teste. O teste serve o axe como um script do próprio site, que a Content Security Policy aceita ([ADR-0035](0035-protecao-contra-abuso.md)).
2. O título da aba muda a cada tela, como "Novo projeto · Gerenciador de Projetos".
3. Ao trocar de tela, o foco vai para o título principal da nova tela, ou para o conteúdo principal enquanto ele carrega. A exceção é a busca: enquanto a pessoa digita, a tela de resultado abre e o foco continua no campo.

## Alternativas consideradas

- **`cypress-axe`:** é o caminho usual, mas não declara suporte ao Cypress 16 e injeta o axe com `eval`, que a Content Security Policy bloqueia.
- **Lighthouse no CI:** avalia uma página por vez, sem interações, então não cobre modais, menus e erros de formulário.
- **Região `aria-live` anunciando a troca de tela:** avisa o leitor de tela, mas deixa o foco no link anterior ou no início da página.
- **Só revisão manual:** depende de lembrar de repetir a revisão a cada mudança.

## Consequências

- Uma regressão de acessibilidade detectável pelo axe reprova o CI.
- O axe não substitui o teste com um leitor de tela real. Ele encontra cerca de metade dos problemas, como contraste, nomes e atributos ARIA.
- Uma dependência de desenvolvimento a mais, usada só nos testes E2E.
