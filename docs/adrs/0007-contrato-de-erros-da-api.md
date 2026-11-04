# ADR-0007: Contrato de erros da API

- **Status**: Accepted
- **Data**: 2026-11-04
- **Feature**: F1

## Contexto e problema

O front-end precisa tratar todos os erros da mesma forma e mostrar cada erro de validação no campo certo, com o texto definido no design.

## Drivers da decisão

- Um único formato para qualquer erro, inclusive os gerados fora dos handlers.
- Erros de validação associados a cada campo.
- Nenhum detalhe interno exposto ao cliente.

## Decisão

Responder todos os erros no formato `application/problem+json` da RFC 9457, com duas extensões: `request_id`, sempre presente, e `errors`, nos erros de validação.

```json
{
  "type": "about:blank",
  "title": "Unprocessable Entity",
  "status": 422,
  "detail": "Um ou mais campos são inválidos.",
  "request_id": "b7e2c1d4",
  "errors": [
    { "field": "name", "code": "min_words" },
    { "field": "end_date", "code": "before_start_date" }
  ]
}
```

A API informa o campo e um `code` estável. O front-end converte cada `code` no texto definido no design.

## Alternativas consideradas

- **Formato próprio (`{ "error": { ... } }`):** seria igualmente simples, mas exigiria documentar um padrão que a RFC já define.
- **Só o status HTTP e uma mensagem em texto:** não permite associar um erro a um campo.
- **Mensagens de validação escritas pela API:** deixariam os textos da interface em dois lugares e prenderiam a API a um idioma.

## Consequências

- O front-end precisa de um único tratamento de erros, e o `request_id` liga cada erro ao seu log.
- O `ServeMux` responde 404 e 405 em texto puro, então um middleware precisa converter essas respostas.
- A lista de códigos faz parte do contrato da API e precisa ficar documentada no OpenAPI.
