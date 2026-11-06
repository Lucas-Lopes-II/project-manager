#!/usr/bin/env bash
# Cria os projetos de exemplo no ambiente local, pela API (docs/features/16-entrega.md).
#
#   scripts/seed-demo.sh                        # API em http://localhost:8080
#   scripts/seed-demo.sh http://localhost:8081  # API em outra porta (API_PORT no .env)
#
# Os projetos que já existem com o mesmo nome são mantidos, então o script pode rodar mais de uma vez.
set -euo pipefail

API=${1:-http://localhost:8080}
API=${API%/}
COVERS=$(cd "$(dirname "$0")" && pwd)/demo-covers

existing=$(curl -sS --fail-with-body "$API/api/v1/projects")
created=0

# nome, cliente, início, fim, capa (opcional), favorito (opcional)
add() {
  local name=$1 client=$2 start=$3 end=$4 cover=${5:-} favorite=${6:-}

  if grep -qF "\"name\":\"$name\"" <<<"$existing"; then
    echo "já existe: $name"
    return
  fi

  local form=(
    --form-string "name=$name"
    --form-string "client=$client"
    --form-string "start_date=$start"
    --form-string "end_date=$end"
  )
  if [ -n "$cover" ]; then
    form+=(--form "cover=@$COVERS/$cover")
  fi

  local id
  id=$(curl -sS --fail-with-body -X POST "$API/api/v1/projects" "${form[@]}" |
    sed -n 's/.*"id":"\([^"]*\)".*/\1/p')

  if [ -n "$favorite" ]; then
    curl -sS --fail-with-body -X PUT "$API/api/v1/projects/$id/favorite"
  fi

  echo "criado: $name"
  created=$((created + 1))
}

add 'Assinatura em Lote' 'Clicksign' 2026-09-01 2026-12-18 assinatura-em-lote.jpg favorito
add 'Portal do Cliente' 'Banco Horizonte' 2026-10-05 2027-03-31 portal-do-cliente.jpg
add 'Migração de Contratos' 'Seguradora Aurora' 2026-08-10 2026-10-30
add 'Aplicativo de Vendas' 'Rede Sabiá' 2026-11-03 2027-02-26 '' favorito
add 'Integração com ERP' 'Metalúrgica Paraná' 2026-07-20 2026-11-27 integracao-com-erp.jpg
add 'Painel de Indicadores' 'Cooperativa Vale Verde' 2026-11-16 2027-01-29
add 'Validação de Documentos' 'Clicksign' 2026-10-19 2026-12-04
add 'Atendimento Automatizado' 'Clínica Bem-Estar' 2026-12-01 2027-04-30

echo "$created projeto(s) criado(s) em $API"
