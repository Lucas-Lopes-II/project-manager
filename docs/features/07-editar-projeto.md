# F7: Editar projeto

## Objetivo

Permitir editar um projeto pelo menu do card, incluindo trocar ou remover a capa, no formulário do Figma.

## Escopo

- API: `PUT /api/v1/projects/{id}` também em `multipart/form-data`, com o arquivo em `cover` ou `remove_cover=true`, em uma única transação ([ADR-0023](../adrs/0023-capa-enviada-junto-com-o-projeto.md)).
- Menu "..." no card, com a opção "Editar".
- Rota `/projetos/:id/editar`, com o formulário preenchido e a prévia da capa atual.
- Estados de carregamento, de erro e de projeto não encontrado.
- Testes da API com banco real, testes de unidade e testes E2E.
- OpenAPI e README atualizados.

## Fora do escopo

- Opção "Remover" do menu e modal de confirmação (F8), porque o menu só mostra o que já funciona.
- Estrela de favorito (F9).
- Aviso de alterações não salvas ao sair da tela, que não existe no design.

## Critérios de aceite

1. O menu "..." do card leva à tela "Editar projeto", com os dados e a capa atuais.
2. O menu abre e fecha pelo mouse e pelo teclado, fecha com Esc e com um clique fora dele, e o Esc devolve o foco ao botão.
3. "Salvar projeto" fica ativo com os dados válidos, mesmo sem alterações, como no Figma, e volta para a listagem com os dados novos.
4. As regras do [ADR-0012](../adrs/0012-regras-de-validacao-de-projetos.md) e as mensagens são as mesmas da criação.
5. Sem mexer na capa, ela é mantida, sem reenviar o arquivo.
6. A troca e a remoção da capa só valem ao salvar, e "Voltar" descarta tudo.
7. Depois de trocar a capa, o card mostra a imagem nova, mesmo com a antiga em cache. Depois de removê-la, mostra o placeholder.
8. Se a gravação falhar, nada é alterado no projeto nem na capa, os dados continuam no formulário e a mensagem de erro aparece.
9. Um projeto inexistente, por link ou removido durante a edição, mostra o card "Projeto não encontrado", com o botão "Voltar para a lista".
10. O carregamento segue o [ADR-0020](../adrs/0020-estados-sem-design.md), inclusive com "Tentar novamente" em caso de falha.
11. A tela e o menu reproduzem o Figma na largura do design, com os ajustes da [F6](06-criar-projeto.md), e não geram rolagem horizontal em 1366, 1440 e 1920 px.

## Regras da API

| Enviado no `PUT` | Resultado |
|---|---|
| JSON, ou formulário sem `cover` e sem `remove_cover` | A capa atual é mantida |
| `cover` | A capa é trocada |
| `remove_cover=true` | A capa é removida |
| `cover` e `remove_cover=true` | Vale o arquivo |

## Textos sem design

| Situação | Texto |
|---|---|
| Carregando | "Carregando projeto..." |
| Falha ao carregar | "Não foi possível carregar o projeto." e "Tentar novamente" |
| Projeto inexistente | "Projeto não encontrado", "Ele pode ter sido removido. Volte para a lista para ver os projetos cadastrados." e "Voltar para a lista" |

## Decisões relacionadas

- [ADR-0023: Capa enviada junto com o projeto](../adrs/0023-capa-enviada-junto-com-o-projeto.md)
- [ADR-0025: Formulário de edição busca o projeto na API](../adrs/0025-formulario-de-edicao-busca-na-api.md)
