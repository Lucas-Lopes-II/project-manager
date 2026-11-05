# ADR-0025: Formulário de edição busca o projeto na API

- **Status**: Accepted
- **Data**: 2026-11-05
- **Feature**: F7

## Contexto e problema

A tela de edição precisa dos dados do projeto para preencher o formulário. Quem chega pelo menu do card já tem esses dados na store da listagem, mas a tela também pode abrir por um link direto ou ao recarregar a página, quando a store está vazia. Como não há login e os dados são compartilhados ([ADR-0013](0013-sem-login-e-com-dados-compartilhados.md)), outra pessoa também pode ter alterado o projeto depois de a lista carregar.

## Drivers da decisão

- A tela funciona da mesma forma ao vir da lista, por link direto ou ao recarregar.
- O formulário começa com os dados atuais.
- Um único caminho de código para carregar o projeto.

## Decisão

1. A tela de edição sempre busca o projeto em `GET /api/v1/projects/{id}` ao abrir.
2. O projeto carregado fica no estado da própria tela, sem passar pela store ([ADR-0016](0016-estado-com-pinia-e-cliente-com-fetch.md)).
3. Enquanto a API não responde, a tela segue os estados do [ADR-0020](0020-estados-sem-design.md): texto de carregamento, erro com "Tentar novamente" e o card de projeto não encontrado.

## Alternativas consideradas

- **Reaproveitar o projeto da lista já carregada:** o formulário abriria na hora, mas ainda seria preciso buscar na API ao recarregar, o que cria dois caminhos, e os dados poderiam estar desatualizados.
- **Mostrar os dados da lista e atualizar ao receber a resposta:** une as duas vantagens, mas pode trocar o texto enquanto a pessoa digita, ou exige regras para evitar isso.

## Consequências

- Abrir a edição exige uma requisição a mais. Como a API responde em cerca de 150 ms em produção, o texto de carregamento, que aparece só depois de 300 ms, raramente é exibido.
- Os dados valem para o momento em que a tela abriu. Se duas pessoas editarem ao mesmo tempo, a última gravação prevalece ([ADR-0009](0009-contrato-rest-de-projetos.md)).
