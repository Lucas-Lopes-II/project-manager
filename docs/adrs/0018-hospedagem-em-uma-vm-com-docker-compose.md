# ADR-0018: Hospedagem em uma VM com Docker Compose

- **Status**: Accepted
- **Data**: 2026-11-05
- **Feature**: F4

## Contexto e problema

A aplicação precisa de uma URL pública e funcional, com dados persistentes e sem custo. Quem avalia pode abrir o link depois de dias sem nenhum acesso, e um problema nesse momento precisa ser fácil de diagnosticar e de corrigir por uma única pessoa.

## Drivers da decisão

- Poucas peças e um único lugar para diagnosticar problemas.
- Primeira tela imediata, sem esperar serviços voltarem da suspensão.
- Custo zero, com um teto real de gastos.
- Produção igual ao ambiente local, com o mesmo Docker Compose.
- Pouca latência para quem usa a aplicação no Brasil.

## Decisão

1. A aplicação roda em uma VM EC2 `t3.micro` (2 vCPU com burst e 1 GiB), em `sa-east-1`, em uma conta no plano gratuito da AWS. A conta é criada pelo cadastro avançado, porque o cadastro simplificado não permite escolher a região.
2. O banco, a API e o front-end rodam na VM, com `compose.prod.yaml`.
3. O Caddy recebe o tráfego e obtém o certificado HTTPS, em um subdomínio gratuito do DuckDNS apontado para um IP fixo.
4. Da internet, só as portas 80 e 443 ficam abertas para todos, e o SSH aceita apenas o IP de quem administra. O banco e a API não publicam portas.
5. Há um único ambiente, sem backup, porque os dados são de avaliação e o banco é limpo antes da entrega ([ADR-0013](0013-sem-login-e-com-dados-compartilhados.md)).
6. O único segredo da aplicação é a senha do banco. O script de instalação a gera na própria VM e a grava no `.env`, fora do Git, com permissão 600.

## Alternativas consideradas

- **Vercel, Cloud Run e Neon:** não há servidor para manter, e cada parte se recupera sozinha. Em troca, são três painéis e dois caminhos de publicação, a primeira requisição depois de um período sem uso é mais lenta, e o teto de gastos do Cloud Run não é absoluto.
- **API e banco na VM, com o front-end na Vercel:** dispensa o HTTPS na VM, mas mantém dois provedores, e a imagem do nginx já serve o front-end e encaminha `/api`.
- **Oracle Cloud Always Free:** não tem prazo para acabar, mas a documentação prevê a retomada de instâncias ociosas, critério em que esta aplicação se encaixa na maior parte do tempo, e avisa sobre falta de capacidade.
- **Google Cloud `e2-micro`:** também não tem prazo, mas só está disponível em regiões dos Estados Unidos e não tem um teto de gastos.
- **Render:** não pede cartão, mas hiberna depois de 15 minutos e leva cerca de 1 minuto para voltar.
- **sslip.io ou nip.io:** dispensam cadastro, mas não constam na Public Suffix List, então todos os seus usuários dividem o mesmo limite de certificados do Let's Encrypt.
- **Certificado para o IP:** não depende de um serviço de DNS, mas expõe o IP na URL e dura apenas 6 dias.
- **`.env` cifrado no repositório, com git-crypt:** permite recriar a configuração a partir do Git, mas a chave de decifração vira outro segredo a levar até a VM, e o arquivo fica para sempre no histórico de um repositório público. A senha também não tem valor sem os dados, que ficam no disco da VM.

## Consequências

- O cadastro exige um cartão, mas o plano gratuito não gera cobrança. A VM, o IP e 10 GB de disco consomem cerca de US$ 17 por mês dos US$ 100 de crédito, o que dura mais de 5 meses.
- A conta é encerrada quando o crédito acaba ou em 6 meses, o que vier primeiro. O prazo basta para a avaliação, mas a URL tem data para acabar.
- A memória não é um limite: banco, API e nginx somados usam cerca de 100 MiB, medidos depois de 900 requisições.
- A VM é um ponto único de falha. O Docker reinicia os containers e os traz de volta depois de um reboot, mas não há outra instância para assumir se a VM cair.
- O sistema operacional e o Docker passam a ser responsabilidade do projeto.
- A senha do banco fica em texto puro na VM, protegida pela permissão do arquivo e pelo acesso SSH. Se a VM for perdida, os dados vão junto, e a VM nova gera outra senha.
- A URL depende do DNS do DuckDNS, e trocar por um domínio próprio exige alterar só uma linha.
