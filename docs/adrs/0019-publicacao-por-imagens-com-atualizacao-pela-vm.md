# ADR-0019: Publicação por imagens, com atualização a partir da VM

- **Status**: Accepted
- **Data**: 2026-11-05
- **Feature**: F4

## Contexto e problema

Cada merge na `main` precisa chegar à produção sem passo manual e sem publicar código que não passou nos testes. A VM é pequena e fica exposta na internet, então é melhor não compilar nela e não abrir mais acessos.

## Drivers da decisão

- Nada é publicado sem passar pelo CI.
- Nenhuma credencial da VM guardada no GitHub.
- Nenhuma porta aberta além do necessário.
- Poucas peças para configurar e manter.

## Decisão

1. Um job `publish-images` no `ci.yml` roda em push na `main`, depende de todos os outros jobs e publica as imagens da API e do front-end no GitHub Container Registry, com o `GITHUB_TOKEN`.
2. Na VM, um timer do systemd roda a cada 2 minutos: atualiza o repositório, baixa as imagens e executa `docker compose up -d --wait`, que só recria o que mudou.
3. As imagens são públicas, então a VM não precisa de credencial para baixá-las.
4. Os segredos ficam só no `.env` da VM.

## Alternativas consideradas

- **SSH a partir do GitHub Actions:** mostra o resultado no próprio pipeline, mas exige guardar uma chave no GitHub e abrir a porta 22 para as faixas de IP dos runners.
- **AWS Systems Manager com OIDC:** não usa chave nem porta aberta e mostra o resultado no pipeline, mas exige mais configuração de permissões do que o projeto justifica.
- **Compilar na VM:** dispensa o registro de imagens, mas consome CPU e memória da máquina que atende os usuários.
- **Watchtower:** faria a atualização com um container pronto, mas o projeto está arquivado.

## Consequências

- O GitHub não tem nenhum acesso à VM, e um vazamento no CI não a alcança.
- Um merge leva alguns minutos para chegar à produção.
- O pipeline não mostra se a VM aplicou a atualização. A verificação é feita na própria VM, com os logs do timer.
- Durante a atualização, o serviço recriado fica fora do ar por alguns segundos.
