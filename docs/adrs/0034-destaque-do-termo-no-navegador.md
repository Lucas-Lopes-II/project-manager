# ADR-0034: Destaque do termo calculado no navegador

- **Status**: Accepted
- **Data**: 2026-11-06
- **Feature**: F13

## Contexto e problema

No Figma, o resultado da busca destaca em laranja o trecho do nome que corresponde ao termo. A API encontra os projetos sem diferenciar maiúsculas e acentos ([ADR-0032](0032-busca-por-nome.md)), então o trecho destacado pode ter outra grafia: buscar "area" encontra "Área Norte". É preciso definir quem calcula o trecho e quais ocorrências são destacadas.

## Drivers da decisão

- O destaque segue a mesma regra que encontrou o projeto.
- O nome aparece com os caracteres originais.
- A API continua devolvendo só os dados do projeto.

## Decisão

1. O navegador calcula o destaque, com o termo que já conhece, sem diferenciar maiúsculas e acentos, como a API.
2. Todas as ocorrências do termo no nome são destacadas, com os caracteres originais.
3. O destaque aparece só no nome, e só na tela de resultado, como no Figma.
4. O trecho fica em um elemento `<mark>`, e o nome completo continua no `title` e para leitores de tela.

## Alternativas consideradas

- **API devolvendo as posições do trecho:** a regra ficaria em um só lugar, mas a API passaria a devolver um dado de apresentação em cada projeto, só para uma tela.
- **Destacar só a primeira ocorrência:** é o que o Figma mostra, mas o exemplo tem uma ocorrência só, e "o nome contém o termo" vale para todas.

## Consequências

- A comparação sem acentos existe na API e no navegador, e as duas precisam continuar iguais.
- O `unaccent` do PostgreSQL converte alguns caracteres que a normalização do navegador mantém, como "ø" e "æ". Um projeto encontrado só por um deles aparece sem destaque.
- Quando o nome é cortado com reticências, um trecho na parte escondida não aparece, e o nome completo continua no `title`.
