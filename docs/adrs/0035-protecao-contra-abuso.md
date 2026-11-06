# ADR-0035: Proteção contra abuso

- **Status**: Accepted
- **Data**: 2026-11-06
- **Feature**: F14

## Contexto e problema

A aplicação é pública, sem login ([ADR-0013](0013-sem-login-e-com-dados-compartilhados.md)), e o endereço dela está no README de um repositório público. Ela roda em uma única VM pequena, com 10 GB de disco, em uma conta da AWS com créditos ([ADR-0018](0018-hospedagem-em-uma-vm-com-docker-compose.md)). Até aqui, nada limitava quantas requisições uma pessoa podia fazer. Um único script poderia sobrecarregar a API e o banco, ou encher o disco em cerca de uma hora criando projetos com capas de 5 MB.

## Drivers da decisão

- Manter a aplicação no ar diante de abuso vindo de uma origem.
- Limitar o disco que os dados podem ocupar.
- Não atrapalhar quem usa a aplicação normalmente.
- Testar os limites com os valores de produção.

## Decisão

1. O nginx limita as requisições por IP:
   - leitura da API: 10 por segundo, com picos de até 100;
   - escrita da API (`POST`, `PUT` e `DELETE`): 30 por minuto, com picos de até 20;
   - páginas e arquivos: 20 por segundo, com picos de até 100;
   - conexões simultâneas: até 100.

   Os picos e as conexões são altos porque, em HTTP/2, o navegador pede todas as capas visíveis ao mesmo tempo, e o Caddy as repassa em paralelo. Uma tela larga mostra dezenas delas.
2. Acima do limite, a resposta é 429. Na API, o corpo segue o formato de erro do [ADR-0007](0007-contrato-de-erros-da-api.md).
3. O IP vem do `X-Forwarded-For` definido pelo Caddy, e o nginx só aceita esse header de endereços da rede interna do Docker.
4. Os limites valem para as requisições que passam pelo Caddy, ou seja, as que chegam com o `X-Forwarded-For`. Na produção, o `web` não publica portas, então tudo passa por ele. Sem o Caddy, no ambiente local e nos testes E2E, não há limite. Um teste E2E envia o header, como o Caddy faria, para verificar os limites de produção.
5. A API aceita no máximo 200 projetos. Acima disso, a criação responde 409, com o código `project_limit`, e o formulário explica o motivo. Com capas de até 5 MB, as imagens ocupam no máximo 1 GB.
6. O nginx envia uma Content Security Policy que só aceita recursos do próprio site, além de imagens em `data:` e `blob:`, usadas pela prévia da capa. Também envia `X-Content-Type-Options`, `Referrer-Policy` e `Permissions-Policy`, impede que a aplicação seja aberta dentro de outro site e não informa a sua versão. O Caddy envia `Strict-Transport-Security`.
7. O front-end trata um 429 como as demais falhas, com as mensagens que já existem.

## Alternativas consideradas

- **Limite dentro da API, em Go:** seria testado com testes de unidade, mas deixaria de fora as páginas, os arquivos e as requisições que nem chegariam à API.
- **Limite no Caddy:** exige uma imagem própria do Caddy com um plugin, porque a imagem oficial não tem limite de requisições.
- **CDN ou WAF na frente da VM (CloudFront, Cloudflare):** é o que protege de ataques vindos de muitas origens, mas exige um domínio que aceite CNAME, e o DuckDNS não aceita. Fica como evolução.
- **Limite pelo tamanho total das capas:** protegeria o disco da mesma forma, mas o teto de projetos é mais simples de entender e de testar.

## Consequências

- Uma origem sozinha não consegue derrubar a aplicação nem encher o disco.
- Um ataque vindo de muitas origens passa pelos limites por IP. Ataques de rede são filtrados pela AWS Shield Standard, que vale para toda conta.
- Sem login, qualquer pessoa ainda pode remover projetos. Os limites só tornam isso mais lento.
- Pessoas atrás do mesmo IP, como em uma empresa, dividem os mesmos limites. Os valores são altos o bastante para o uso normal.
- Se o `web` for exposto sem o Caddy, os limites deixam de valer. A [ADR-0018](0018-hospedagem-em-uma-vm-com-docker-compose.md) mantém só as portas 80 e 443 abertas, ambas no Caddy.
- A CSP passa a valer também no ambiente local e nos testes E2E, que falham se ela bloquear algo da aplicação.
