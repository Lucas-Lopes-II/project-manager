#!/usr/bin/env bash
# Prepares a fresh Ubuntu VM and starts the application. It is safe to run again.
set -euo pipefail

main() {
  local domain=${1:-}
  if [[ -z "$domain" ]]; then
    echo "Uso: ./deploy/setup-vm.sh <dominio>" >&2
    exit 1
  fi

  cd "$(dirname "$(readlink -f "$0")")/.."

  echo "==> Instalando o Docker"
  sudo apt-get update -qq
  sudo env DEBIAN_FRONTEND=noninteractive NEEDRESTART_MODE=a \
    apt-get install -y -qq docker.io docker-compose-v2
  sudo systemctl enable --now docker
  sudo usermod -aG docker "$USER"

  echo "==> Gerando a configuração"
  if [[ -f .env ]]; then
    sed -i "s/^DOMAIN=.*/DOMAIN=$domain/" .env
  else
    (
      umask 077
      cat > .env <<ENV
COMPOSE_FILE=compose.prod.yaml
DOMAIN=$domain
POSTGRES_USER=project_manager
POSTGRES_PASSWORD=$(openssl rand -hex 24)
POSTGRES_DB=project_manager
ENV
    )
  fi

  echo "==> Subindo a aplicação"
  sudo docker compose up -d --wait

  echo "==> Ativando a atualização automática"
  sudo install -m 644 deploy/project-manager-update.service deploy/project-manager-update.timer /etc/systemd/system/
  sudo systemctl daemon-reload
  sudo systemctl enable --now project-manager-update.timer

  echo
  echo "Pronto: https://$domain"
}

main "$@"
