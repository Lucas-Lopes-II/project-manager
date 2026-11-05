# Deploy

A aplicação roda em uma única VM, com o mesmo Docker Compose usado localmente. As decisões estão no [ADR-0018](adrs/0018-hospedagem-em-uma-vm-com-docker-compose.md) e no [ADR-0019](adrs/0019-publicacao-por-imagens-com-atualizacao-pela-vm.md).

## Como funciona

```text
navegador -> Caddy (HTTPS) -> nginx (front-end e /api) -> API -> PostgreSQL
```

Só o Caddy publica portas. O banco e a API ficam na rede interna do Compose.

```text
merge na main -> CI verde -> imagens no GitHub Container Registry -> VM busca as imagens novas
```

Um timer do systemd roda [`deploy/update.sh`](../deploy/update.sh) a cada 2 minutos, e o Compose só recria o que mudou.

## Como recriar o ambiente

É preciso ter:

- As imagens `project-manager-api` e `project-manager-web` públicas no GitHub Container Registry.
- Uma VM com Ubuntu 24.04 (x86), com o usuário `ubuntu` e as portas 80 e 443 abertas.
- Um domínio apontando para o IP da VM.

Na VM:

```bash
git clone https://github.com/Lucas-Lopes-II/project-manager.git
cd project-manager
./deploy/setup-vm.sh meu-dominio.example.com
```

O script instala o Docker, gera o `.env` com uma senha aleatória, sobe a aplicação e ativa o timer. Ele pode ser executado de novo, inclusive para trocar o domínio, e mantém a senha e os dados.

## Operação

Na pasta `project-manager`, na VM:

| Para | Comando |
|---|---|
| Ver os serviços | `docker compose ps` |
| Ver os logs | `docker compose logs -f --tail 100` |
| Atualizar agora | `./deploy/update.sh` |
| Ver as atualizações | `journalctl -u project-manager-update.service -n 50 --no-pager` |
| Parar | `docker compose down` |
| Parar e apagar os dados | `docker compose down -v` |
