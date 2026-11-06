# F16: Entrega

## Objetivo

Deixar o repositório e a produção prontos para a avaliação: um README que explique o que foi feito e por quê, dados de exemplo para ver a aplicação completa no ambiente local e a confirmação de que tudo funciona como quem avalia vai encontrar.

## Escopo

- README final, com o que a aplicação faz, as principais decisões, os ajustes em relação ao Figma e as limitações conhecidas.
- Script de dados de exemplo para o ambiente local, verificado no CI.
- Teste do README em um clone novo do repositório, com o Docker sem cache.
- Teste de todos os fluxos em produção, em um navegador sem cache nem histórico.
- Produção limpa na entrega, com a lista vazia no primeiro acesso ([ADR-0013](../adrs/0013-sem-login-e-com-dados-compartilhados.md)).

## Fora do escopo

- Novas funcionalidades.
- Dados de exemplo em produção, que o ADR-0013 descarta.
- Teste com leitores de tela reais ([ADR-0037](../adrs/0037-acessibilidade-verificada-e-anuncio-de-tela.md)).

## Critérios de aceite

1. O README descreve o que a aplicação faz, as principais decisões, os ajustes em relação ao Figma e as limitações, sem texto provisório.
2. Em um clone novo, seguindo o README e com o Docker sem cache, a aplicação sobe com um comando e todos os testes passam.
3. `scripts/seed-demo.sh` cria 8 projetos de exemplo no ambiente local, 2 deles favoritos e 3 com capa. Rodar o script de novo não duplica os projetos.
4. Em produção, em um navegador sem cache, todos os fluxos funcionam em 1940, 1366 e 375 px.
5. Na entrega, a produção não tem nenhum projeto, e o primeiro acesso mostra a lista vazia.
6. Todos os links da documentação funcionam.

## Dados de exemplo

| Projeto | Cliente | Início | Fim | Favorito | Capa |
|---|---|---|---|---|---|
| Assinatura em Lote | Clicksign | 01/09/2026 | 18/12/2026 | Sim | Sim |
| Portal do Cliente | Banco Horizonte | 05/10/2026 | 31/03/2027 | | Sim |
| Migração de Contratos | Seguradora Aurora | 10/08/2026 | 30/10/2026 | | |
| Aplicativo de Vendas | Rede Sabiá | 03/11/2026 | 26/02/2027 | Sim | |
| Integração com ERP | Metalúrgica Paraná | 20/07/2026 | 27/11/2026 | | Sim |
| Painel de Indicadores | Cooperativa Vale Verde | 16/11/2026 | 29/01/2027 | | |
| Validação de Documentos | Clicksign | 19/10/2026 | 04/12/2026 | | |
| Atendimento Automatizado | Clínica Bem-Estar | 01/12/2026 | 30/04/2027 | | |

As datas mostram as três ordenações, incluindo um projeto vencido, que fica no fim da ordem por prazo ([ADR-0029](../adrs/0029-ordem-por-prazo-com-vencidos-no-fim.md)). Os nomes com acento permitem testar a busca sem acento. As capas são imagens abstratas nas cores do design.

## Decisões relacionadas

- [ADR-0013: Sem login e com dados compartilhados](../adrs/0013-sem-login-e-com-dados-compartilhados.md)
- [ADR-0019: Publicação por imagens, com atualização a partir da VM](../adrs/0019-publicacao-por-imagens-com-atualizacao-pela-vm.md)
