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
  reload_caddy_if_changed
  docker image prune -f > /dev/null
}

# The Caddyfile folder is mounted from the repository, so Caddy only applies a change after a
# reload. The applied version is kept outside Git, which also covers the first run.
reload_caddy_if_changed() {
  local applied=.caddyfile.applied current
  current=$(sha256sum deploy/caddy/Caddyfile | cut -d' ' -f1)
  if [[ "$(cat "$applied" 2> /dev/null)" != "$current" ]]; then
    docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
    echo "$current" > "$applied"
  fi
}

main "$@"
