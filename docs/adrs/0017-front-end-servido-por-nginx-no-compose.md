# ADR-0017: Front-end servido por nginx no Compose

- **Status**: Accepted
- **Data**: 2026-11-04
- **Feature**: F3

## Contexto e problema

O Compose precisa subir a aplicação completa com um único comando. O build do front-end gera arquivos estáticos, que alguém precisa servir, incluindo o retorno ao `index.html` nas rotas internas. O navegador também precisa chegar à API sem CORS.

## Drivers da decisão

- Aplicação completa com um único comando.
- Mesma origem para o front-end e a API, sem configurar CORS.
- Mesmo caminho `/api` em todos os ambientes, para o código não mudar entre eles.

## Decisão

No Compose, o serviço `web` usa uma imagem do nginx sem root, que serve o build e encaminha `/api` para o serviço `api`. Em desenvolvimento, o proxy do Vite faz esse encaminhamento. O cliente HTTP sempre chama o caminho relativo `/api/v1`.

## Alternativas consideradas

- **Embutir o front-end no binário da API:** daria uma única imagem, mas juntaria o deploy das duas partes e faria um cold start da API atrasar também a primeira tela.
- **`vite preview`:** é prático, mas a própria documentação do Vite diz que não serve para produção.
- **Caddy:** teria uma configuração mais curta, mas o nginx é mais conhecido e não traz desvantagem aqui.
- **CORS, com a URL da API em uma variável de build:** exigiria uma imagem por ambiente e uma configuração a mais na API.

## Consequências

- O avaliador usa a aplicação completa com `docker compose up`, sem instalar o Node.
- A configuração do nginx é mais um arquivo a manter.
- A hospedagem de produção precisa fazer o mesmo encaminhamento de `/api`, o que será tratado na escolha da hospedagem.
