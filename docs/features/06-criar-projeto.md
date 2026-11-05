# F6: Criar projeto

## Objetivo

Permitir criar um projeto, com capa opcional, pelo formulário do Figma, e mostrar os projetos cadastrados em cards na listagem.

## Escopo

- API: tabela `project_covers`, criação em `multipart/form-data` e rota que serve a capa.
- nginx: limite de corpo compatível com o tamanho da capa.
- Formulário de criação, com validação, estados de erro, prévia e remoção da capa escolhida.
- Cards na listagem, com a capa ou o placeholder, o nome, o cliente e as datas.
- Botão "Novo projeto" na barra da listagem.
- Ícone de busca escondido nas telas de formulário.
- Testes da API com banco real, testes de unidade e testes E2E.
- OpenAPI e README atualizados.

## Fora do escopo

- Trocar ou remover a capa de um projeto salvo (F7).
- Remoção de projetos pela tela (F8).
- Estrela de favorito e menu do card (F8 e F9), que só entram com as suas funções.
- Toggle de favoritos (F9) e select de ordenação (F10).
- Redimensionar as imagens enviadas ([ADR-0022](../adrs/0022-capas-no-postgresql.md)).

## Critérios de aceite

1. Com os campos válidos, "Salvar projeto" cria o projeto e volta para a listagem, onde o card aparece.
2. Com o formulário vazio ou com erro, "Salvar projeto" fica desabilitado.
3. As regras do [ADR-0012](../adrs/0012-regras-de-validacao-de-projetos.md) valem no formulário e na API, com as mensagens do Figma. O erro aparece quando a pessoa sai do campo.
4. Uma capa JPG ou PNG de até 5 MB aparece na prévia, pode ser retirada antes de salvar e aparece no card depois de salva.
5. Um arquivo de outro formato ou acima de 5 MB é recusado no formulário e na API, mesmo com o nome ou o tipo alterado.
6. Sem capa, o card mostra o placeholder do Figma.
7. Se a gravação falhar, nada fica salvo, os dados continuam no formulário e a mensagem de erro aparece. Salvar de novo não duplica o projeto.
8. O formulário e os cards reproduzem o Figma na largura do design, em comparação lado a lado, com os ajustes listados abaixo.
9. O layout não gera rolagem horizontal em 1366, 1440 e 1920 px.
10. Os campos têm rótulos, os erros estão associados a eles, e todo o formulário funciona pelo teclado.
11. Os testes E2E cobrem a criação com e sem capa, incluindo um arquivo de 5 MB passando pelo nginx.

## Ajustes em relação ao Figma

- **Coluna do formulário:** no Figma, os campos têm 702 ou 704 px e começam em 618 ou 620 px. Aqui, todos ocupam a mesma coluna de 704 px, que é a do botão.
- **Cantos dos campos:** o Figma alterna entre 4 e 8 px. Aqui, todos usam 8 px.
- **Textos longos no card:** nome e cliente ficam em uma linha, com reticências e o texto completo ao passar o mouse.

## Textos sem design

| Situação | Texto |
|---|---|
| Nome ou cliente acima de 120 caracteres | "Use no máximo 120 caracteres" |
| Arquivo de outro formato ou corrompido | "Escolha uma imagem .jpg ou .png" |
| Arquivo acima do limite | "A imagem deve ter até 5 MB" |
| Falha ao salvar | "Não foi possível salvar o projeto. Tente novamente." |

## Decisões relacionadas

- [ADR-0022: Capas no PostgreSQL](../adrs/0022-capas-no-postgresql.md)
- [ADR-0023: Capa enviada junto com o projeto](../adrs/0023-capa-enviada-junto-com-o-projeto.md)
- [ADR-0024: Campos de data nativos, com o visual do design](../adrs/0024-campos-de-data-nativos.md)
