# ADR-0023: Capa enviada junto com o projeto

- **Status**: Accepted
- **Data**: 2026-11-05
- **Feature**: F6

## Contexto e problema

O formulário salva os campos do projeto e a capa com um único botão. A API de projetos recebe JSON ([ADR-0009](0009-contrato-rest-de-projetos.md)), que não transporta arquivos de forma eficiente. É preciso definir como a capa chega à API e o que acontece quando parte da operação falha.

## Drivers da decisão

- Nenhum estado intermediário: o projeto é salvo por inteiro ou não é salvo.
- Nova tentativa simples, sem risco de duplicar o projeto.
- Erros de todos os campos em uma única resposta ([ADR-0007](0007-contrato-de-erros-da-api.md)).
- Nenhuma quebra para quem já usa o contrato em JSON.

## Decisão

1. `POST /api/v1/projects` passa a aceitar também `multipart/form-data`, com os mesmos campos de texto e um arquivo opcional em `cover`.
2. O projeto e a capa são gravados na mesma transação.
3. Uma capa inválida volta no mesmo erro 422 dos demais campos, no campo `cover`, com o código `invalid_image` ou `max_size`. Um corpo acima do limite da rota volta como 413.
4. O envio em JSON continua funcionando, sem capa. O front-end sempre usa `multipart/form-data`, para ter um único caminho.
5. Na edição (F7), `PUT /api/v1/projects/{id}` segue o mesmo formato. Sem o arquivo, a capa atual é mantida, e a remoção é um pedido explícito.

## Alternativas consideradas

- **Rota própria para a capa, depois de criar o projeto (`PUT /projects/{id}/cover`):** mantém o JSON como único formato de escrita, mas são duas requisições. Se a segunda falhar, o projeto fica salvo sem capa, e o formulário precisa lembrar o id para a nova tentativa não duplicar o projeto. A edição teria o mesmo problema.
- **Enviar a capa antes e referenciá-la no projeto (`cover_id`):** a gravação do projeto continua atômica, mas capas enviadas e nunca usadas se acumulam e exigem uma limpeza, em uma API pública.
- **Capa em base64 no JSON:** mantém um único formato, mas aumenta o arquivo em cerca de 33% e obriga a elevar o limite de todas as rotas JSON.

## Consequências

- Uma falha nunca deixa um projeto pela metade, e tentar de novo é só enviar o mesmo formulário.
- A API passa a ter dois formatos de entrada na mesma rota, que resultam nos mesmos dados validados.
- Um erro em um campo de texto só é descoberto depois do envio do arquivo. Isso é raro, porque o front-end valida antes.
- Em `PUT`, a ausência do arquivo significa "manter", o que é uma pequena exceção à substituição completa, adotada para não reenviar a imagem a cada edição.
- Formulários `multipart` não exigem a verificação prévia de CORS. Isso não abre nada novo aqui, porque a API não usa cookies nem login, e qualquer pessoa já pode chamá-la diretamente.
