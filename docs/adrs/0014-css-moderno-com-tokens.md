# ADR-0014: CSS moderno com tokens

- **Status**: Accepted
- **Data**: 2026-11-04
- **Feature**: F3

## Contexto e problema

Fidelidade ao design é um requisito central, e o Figma define cores, fontes, medidas e componentes próprios, como o select de ordenação e o toggle de favoritos. A forma de escrever os estilos precisa dar controle total sobre o resultado.

## Drivers da decisão

- Reproduzir o Figma sem brigar com estilos prontos.
- Um único lugar para os valores do design.
- Poucas dependências e nenhuma etapa de build que o navegador já não dispense.

## Decisão

1. Os valores do Figma ficam em custom properties, em um arquivo de tokens.
2. Cada componente tem seu CSS em `<style scoped>`, usando esses tokens.
3. O CSS é padrão, com aninhamento nativo, grid e flexbox, sem pré-processador.
4. Nenhuma biblioteca de componentes é usada.
5. As fontes são instaladas como dependência e servidas pela própria aplicação.
6. Os ícones são arquivos SVG exportados do Figma.

## Alternativas consideradas

- **SCSS:** variáveis e aninhamento já existem no CSS nativo, então adicionaria uma dependência por pouco ganho.
- **Tailwind:** é produtivo, mas repete nos templates valores que aqui têm nome no design e dificulta a leitura de componentes com muitos estados.
- **Vuetify ou PrimeVue:** aceleram o início, mas trazem um visual próprio, que precisaria ser sobrescrito para seguir o Figma.
- **Google Fonts por CDN:** é o mais simples, mas depende de um servidor externo e acrescenta uma requisição a cada acesso.

## Consequências

- O design tem uma representação única no código, e mudar um valor afeta todos os seus usos.
- Componentes como select, menu e modal são escritos à mão, incluindo o comportamento de teclado e a acessibilidade.
- O aninhamento nativo exige navegadores recentes, o que é aceitável aqui.
