# ADR-0031: Publicação com espera no lugar do erro

- **Status**: Accepted
- **Data**: 2026-11-05
- **Feature**: F10

## Contexto e problema

Cada publicação recria os containers da API e do `web` ([ADR-0019](0019-publicacao-por-imagens-com-atualizacao-pela-vm.md)). Nas publicações das F7, F8 e F9, o monitor de produção, com uma verificação por segundo, registrou cerca de 6 segundos de erro 502. Os logs da VM mostram que o healthcheck da API roda a cada 5 segundos, e o `web` só sobe depois de a API ser considerada saudável.

Uma medição local com tráfego contínuo, recriando os dois containers como a VM faz, mostrou um problema maior. Quando a API para, o seu endereço some da rede, e o nginx antigo fica tentando conectar nele com o prazo padrão de 60 segundos. Com essa requisição presa, o container do `web` só para quando o Docker o derruba, 10 segundos depois. O resultado foram requisições presas por até 10 segundos e cerca de 20 segundos de erro 502.

## Drivers da decisão

- Menos tempo com erro durante uma publicação.
- Nenhuma mudança na arquitetura nem no consumo de memória.
- O mesmo comportamento no ambiente local, nos testes E2E e na produção.

## Decisão

1. Os healthchecks da API e do `web` usam `start_period` com `start_interval: 1s`, então um container novo é considerado saudável cerca de 1 segundo depois de subir. Depois disso, a verificação volta a ser a cada 5 segundos.
2. O nginx desiste de conectar na API depois de 2 segundos (`proxy_connect_timeout`). Como os dois estão na mesma rede, uma conexão demorada significa que a API está sendo trocada, e falhar rápido deixa o container antigo parar logo.
3. O Caddy tenta o `web` de novo por até 10 segundos, a cada 250 ms, quando a conexão falha. Durante a troca do `web`, a página demora um pouco mais em vez de responder 502.
4. O script de atualização da VM recarrega o Caddy quando o Caddyfile muda, porque o arquivo é montado do repositório e o Caddy só o lê de novo em um `reload`.

## Alternativas consideradas

- **`web` subindo sem esperar a API ficar saudável:** parecia reduzir a espera, mas foi medido e não ajudou, porque o tempo era gasto na parada do nginx antigo, preso à API.
- **Duas instâncias da API, com troca gradual:** elimina a queda, mas dobra a memória da API e exige um balanceamento que não se justifica com uma única VM.
- **Healthcheck a cada 1 segundo, o tempo todo:** reduz a espera da mesma forma, mas faz cinco vezes mais verificações durante todo o tempo em que nada muda.

## Consequências

- Na mesma medição local, a troca completa caiu de 22 para cerca de 6,5 segundos. A página não respondeu nenhum erro, só demorou até 3,5 segundos, e a API respondeu erro por cerca de 2 segundos.
- As chamadas à API ainda falham por cerca de 2 segundos, enquanto ela reinicia, porque o nginx não tem outra instância para tentar.
- Uma chamada à API que leve mais de 2 segundos só para conectar passa a responder 504, o que não deve acontecer na mesma rede fora de uma troca.
- `start_interval` exige o Docker Engine 25 ou mais recente na VM.
