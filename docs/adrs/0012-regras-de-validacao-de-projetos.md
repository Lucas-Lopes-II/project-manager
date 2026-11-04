# ADR-0012: Regras de validação de projetos

- **Status**: Accepted
- **Data**: 2026-11-04
- **Feature**: F2

## Contexto e problema

O design traz as mensagens de erro do formulário, mas não define as regras por completo. O quadro de validações é ilustrativo: ele marca o cliente "Iridium" com a mensagem "ao menos uma palavra", embora o valor tenha uma palavra. Já o quadro de edição mostra o nome "Iridium" com o botão de salvar ativo, embora a mensagem do nome peça duas palavras. É preciso definir as regras, porque a API é pública e não pode depender da validação do front-end.

## Drivers da decisão

- Seguir as mensagens definidas no design.
- Aplicar as mesmas regras na criação e na edição.
- Garantir os dados na API, mesmo sem passar pelo formulário.

## Decisão

| Campo | Regra | Código do erro | Mensagem no design |
|---|---|---|---|
| `name` | Ao menos 2 palavras | `min_words` | "Por favor, digite ao menos duas palavras" |
| `client` | Ao menos 1 palavra | `min_words` | "Por favor, digite ao menos uma palavra" |
| `name` e `client` | Até 120 caracteres | `max_length` | Sem mensagem definida |
| `start_date` e `end_date` | Data válida e obrigatória | `invalid_date` | "Selecione uma data válida" |
| `start_date` e `end_date` | Data final posterior à inicial | `invalid_date_range` | "Selecione uma data válida" |

- Uma palavra é um trecho sem espaços que contém ao menos uma letra ou um número.
- Antes de validar e salvar, o texto perde os espaços nas pontas, e espaços repetidos viram um só.
- Datas passadas são aceitas.
- Quando a data final não é posterior à inicial, os dois campos recebem o erro, como no quadro de validações.
- O front-end repete as regras para dar retorno imediato, mas a API é quem decide.

## Alternativas consideradas

- **Exigir duas palavras só na criação:** explicaria o quadro de edição, mas deixaria a mesma regra valendo apenas em parte.
- **Proibir datas passadas:** não permitiria cadastrar projetos já iniciados, que a ordenação "Iniciados mais recentes" pressupõe, e impediria editar projetos antigos.
- **Aceitar data final igual à inicial:** permitiria projetos de um dia, mas contrariaria o quadro de validações, que marca como inválidas duas datas iguais.
- **Validar só no front-end:** deixaria a API aceitar dados inválidos.

## Consequências

- O formulário e a API seguem a mesma regra, e o front-end converte cada código na mensagem do design.
- As regras ficam em dois lugares, então uma mudança precisa ser feita na API e no front-end.
- Projetos com nome de uma palavra e projetos de um único dia não podem ser cadastrados.
- O limite de 120 caracteres não vem do design e precisará de uma mensagem própria.
