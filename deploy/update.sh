#!/usr/bin/env bash
# Brings the VM up to date with the main branch and the images published by CI.
# Everything is inside main() because git pull may replace this file while it runs.
set -euo pipefail

main() {
  cd "$(dirname "$(readlink -f "$0")")/.."

  git pull --ff-only --quiet
  # postgres and caddy are left out: they only change when compose.prod.yaml does.
  # A failed pull keeps the current version running until the next attempt.
  docker compose pull --quiet --ignore-pull-failures api web
  docker compose up -d --wait --remove-orphans
  docker image prune -f > /dev/null
}

main "$@"
