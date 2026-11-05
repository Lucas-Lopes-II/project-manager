# F8: Remover projeto

## Objetivo

Permitir remover um projeto pelo menu do card, com o modal de confirmação do Figma.

## Escopo

- Opção "Remover" no menu do card, com o ícone e o divisor do Figma.
- Modal de confirmação com `<dialog>` ([ADR-0026](../adrs/0026-modal-com-dialog-nativo.md)).
- Remoção pela API existente, que também apaga a capa, e atualização da lista sem nova busca.
- Testes de unidade e testes E2E.
- Queda medida durante a publicação, registrada no [ADR-0019](../adrs/0019-publicacao-por-imagens-com-atualizacao-pela-vm.md).

## Fora do escopo

- Desfazer a remoção, que o modal informa ser definitiva ([ADR-0009](../adrs/0009-contrato-rest-de-projetos.md)).
- Aviso de sucesso, que não existe no design.
- Remover pela tela de edição, que não tem essa opção no Figma.

## Critérios de aceite

1. "Remover", no menu do card, abre o modal com o nome do projeto.
2. "Confirmar" remove o projeto e a capa, o card some, e o total diminui. Ao remover o último projeto, aparece a tela "Nenhum projeto".
3. O card só some depois que a API confirma. Enquanto isso, os botões ficam desabilitados e o modal não fecha.
4. Se a remoção falhar, o modal continua aberto com o erro, o projeto continua na lista, e "Confirmar" tenta de novo.
5. Um projeto já removido por outra pessoa sai da lista, sem erro.
6. "Cancelar", Esc e um clique fora do modal fecham sem remover, e o foco volta ao botão "..." do card.
7. Ao abrir, o foco vai para "Cancelar". Depois de remover, ele vai para o título da lista.
8. O modal e o menu reproduzem o Figma na largura do design, com os ajustes abaixo, e não geram rolagem horizontal em 1366, 1440 e 1920 px.

## Ajustes em relação ao Figma

- **Ícone do modal:** no Figma, o círculo fica 4 px à esquerda do centro do modal. Aqui ele está centralizado.
- **Posição do modal:** no Figma, ele começa a 292 px do topo de uma tela de 1080 px. Aqui ele mantém essa proporção, de 27% da altura, para caber em telas menores.

## Textos sem design

| Situação | Texto |
|---|---|
| Falha ao remover | "Não foi possível remover o projeto. Tente novamente." |

## Decisões relacionadas

- [ADR-0026: Modal com o elemento `<dialog>` nativo](../adrs/0026-modal-com-dialog-nativo.md)
- [ADR-0016: Estado com Pinia e cliente com `fetch`](../adrs/0016-estado-com-pinia-e-cliente-com-fetch.md)
