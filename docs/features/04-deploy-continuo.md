# F4: Deploy contínuo

## Objetivo

Ter a aplicação no ar em uma URL pública desde o início do desenvolvimento, com cada merge na `main` publicado sem passo manual.

## Escopo

- Uma VM EC2 em São Paulo, com Ubuntu e Docker, rodando toda a aplicação com Docker Compose.
- `compose.prod.yaml`, com as imagens publicadas, reinício automático e rotação de logs.
- Caddy na frente da aplicação, com HTTPS automático em um subdomínio gratuito.
- Job `publish-images` no CI, executado na `main` depois dos demais, que publica as imagens no GitHub Container Registry.
- Atualização automática na VM, que busca as imagens novas periodicamente.
- `docs/deploy.md`, com os passos para recriar o ambiente, e README com a URL da aplicação.

## Fora do escopo

- Ambiente de homologação: há um único conjunto de dados ([ADR-0013](../adrs/0013-sem-login-e-com-dados-compartilhados.md)).
- Backup: os dados são de avaliação, e o banco é limpo antes da entrega.
- Domínio próprio.
- Limite de requisições por cliente.
- Consumo da API pelas telas, a partir da F5.

## Critérios de aceite

1. A URL abre a aplicação em HTTPS, com certificado válido, e recarregar uma rota interna continua funcionando.
2. `/api/v1/projects` responde pela URL pública, e criar, consultar, editar e remover um projeto funciona.
3. Um merge na `main` chega à produção em até 10 minutos, sem passo manual. Um PR não publica nada.
4. As imagens só são publicadas depois que todos os outros jobs passam.
5. Depois de reiniciar a VM, a aplicação volta sozinha, com os dados mantidos.
6. Uma nova publicação mantém os dados e não reaplica as migrations.
7. Depois de pelo menos 1 hora sem uso, a primeira tela abre em menos de 2 segundos.
8. O repositório não contém segredos, e da internet só as portas 80 e 443 estão abertas para todos. O banco e a API não são acessíveis diretamente.
9. A conta da AWS está no plano gratuito.

## Decisões relacionadas

- [ADR-0018: Hospedagem em uma VM com Docker Compose](../adrs/0018-hospedagem-em-uma-vm-com-docker-compose.md)
- [ADR-0019: Publicação por imagens, com atualização a partir da VM](../adrs/0019-publicacao-por-imagens-com-atualizacao-pela-vm.md)
