# ADR-0022: Capas no PostgreSQL

- **Status**: Accepted
- **Data**: 2026-11-05
- **Feature**: F6

## Contexto e problema

Cada projeto pode ter uma capa em JPG ou PNG, e o design não define um tamanho máximo. A API roda em uma única VM, sem login e com um único disco ([ADR-0013](0013-sem-login-e-com-dados-compartilhados.md) e [ADR-0018](0018-hospedagem-em-uma-vm-com-docker-compose.md)). É preciso definir onde os arquivos ficam, sem criar um segundo lugar para manter em ordem.

## Drivers da decisão

- Poucas peças para operar, com um único lugar para os dados.
- Projeto e capa sempre consistentes, inclusive na remoção.
- Listagem rápida, sem carregar os arquivos.
- Mesmo comportamento no ambiente local, no CI e na produção.

## Decisão

1. As capas ficam em uma tabela própria, `project_covers`, com uma linha por projeto, em uma coluna `BYTEA`. A remoção do projeto apaga a capa em cascata.
2. Cada capa tem até 5 MB, e a API só aceita JPEG e PNG. O formato é identificado pelo conteúdo do arquivo, e não pelo nome nem pelo tipo informado por quem envia.
3. A API serve a imagem em `GET /api/v1/projects/{id}/cover`. O projeto informa o endereço em `cover_url`, ou `null` quando não há capa.
4. `cover_url` traz a data da última alteração da capa. Esse endereço pode ficar em cache por um ano, e qualquer outro precisa ser revalidado.

## Alternativas consideradas

- **Volume em disco na VM:** o nginx serviria os arquivos direto, mas o banco e o disco poderiam divergir, sem uma transação em comum, e a API e o nginx teriam de compartilhar um volume.
- **S3:** é o caminho natural em um produto real, com CDN e sem carga na API. Aqui, exigiria credenciais na VM, mais um serviço e um substituto no ambiente local. Como o front-end só conhece `cover_url`, a troca não o afeta se o volume crescer.
- **Coluna na própria tabela `projects`:** dispensa uma tabela, mas qualquer `SELECT` descuidado carregaria os arquivos.

## Consequências

- O banco, o volume de dados e a transação continuam sendo um só, e a capa não sobrevive ao projeto.
- As imagens passam pela API e pela memória dela, o que limita o uso a volumes pequenos.
- As fotos não são redimensionadas, então uma capa de 5 MB é baixada inteira na listagem. O navegador só as carrega quando chegam perto da área visível.
- Como a API é pública, alguém poderia encher os 10 GB de disco enviando muitas capas. O risco é aceito pelo mesmo motivo do [ADR-0013](0013-sem-login-e-com-dados-compartilhados.md); em um produto real, a autenticação e uma cota viriam primeiro.
