# ADR-0033: Histórico de busca no navegador

- **Status**: Accepted
- **Data**: 2026-11-06
- **Feature**: F12

## Contexto e problema

O Figma mostra, abaixo da barra de busca aberta, as últimas 5 buscas, cada uma com um X para removê-la. A aplicação não tem login, e todos veem os mesmos projetos ([ADR-0013](0013-sem-login-e-com-dados-compartilhados.md)). É preciso definir onde o histórico fica, o que conta como uma busca e quando a lista aparece.

## Drivers da decisão

- O histórico é de quem busca, e não de todos que usam a aplicação.
- Continuar disponível depois de recarregar a página ou fechar o navegador.
- Não guardar cada etapa da digitação, já que a busca roda enquanto a pessoa digita ([ADR-0032](0032-busca-por-nome.md)).
- Funcionar só com o teclado e com leitores de tela.

## Decisão

1. O histórico fica no `localStorage` do navegador, e as abas abertas acompanham as mudanças umas das outras pelo evento `storage`. Se ele estiver indisponível ou bloqueado, o histórico vale só enquanto a página estiver aberta, sem mostrar erro.
2. Cada busca que roda, com 3 ou mais caracteres, entra no topo do histórico, com no máximo 5 termos, do mais novo para o mais antigo.
3. Um termo novo substitui o mais recente quando um deles começa com o outro, como "proj" e "projeto". Repetir uma busca a leva para o topo. As duas comparações não diferenciam maiúsculas e acentos, como a busca.
4. A lista aparece com a barra aberta, o foco nela e o campo vazio, e some quando a pessoa digita.
5. Cada termo e cada X são botões alcançáveis pelo Tab, e o X tem um nome próprio, como "Remover projeto do histórico". Depois de uma remoção pelo teclado, o foco vai para o próximo termo, ou para o anterior no fim da lista, ou para o campo se a lista ficar vazia. Um clique mantém o foco onde estava.
6. Não há opção de apagar tudo, que não existe no design.

## Alternativas consideradas

- **Guardar na API:** sem login, um histórico no servidor seria o mesmo para todos, e as buscas de uma pessoa apareceriam para as outras.
- **`sessionStorage`:** o histórico se perderia ao fechar a aba, o que reduz a utilidade de "buscas recentes".
- **Guardar só no Enter:** como a busca roda enquanto a pessoa digita, quem não aperta Enter nunca teria histórico.
- **Guardar cada busca que roda, sem a regra do prefixo:** "pro", "proj" e "projeto" ocupariam 3 dos 5 lugares numa única busca.

## Consequências

- Cada navegador tem o seu histórico, que não acompanha a pessoa em outro aparelho.
- O histórico guarda termos digitados, e não projetos, então pode trazer termos que não encontram mais nada. Basta removê-los pelo X.
- Uma busca feita em uma aba aparece na hora nas outras, e nenhuma delas apaga o que a outra gravou.
- Duas buscas seguidas que começam uma com a outra viram uma só, mesmo quando feitas em momentos diferentes.
