#!/bin/bash
set -euo pipefail

is_truthy() {
  case "$1" in
    1|true|TRUE|yes|YES|on|ON) return 0 ;;
    *) return 1 ;;
  esac
}

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[backend] DATABASE_URL is not defined. Unable to start." >&2
  exit 1
fi

if [ -n "${TZ:-}" ]; then
  ln -snf "/usr/share/zoneinfo/$TZ" /etc/localtime && echo "$TZ" > /etc/timezone || true
fi

run_migrations() {
  local attempt=1
  local max_attempts=${1:-10}
  local sleep_seconds=${2:-5}

  echo "[backend] Applying database migrations..."
  until npx prisma migrate deploy; do
    echo "[backend] Migration attempt ${attempt}/${max_attempts} failed."

    if (( attempt >= max_attempts )); then
      echo "[backend] Failed to apply migrations after ${max_attempts} attempts."
      return 1
    fi

    attempt=$(( attempt + 1 ))
    echo "[backend] Waiting ${sleep_seconds}s before retrying migrations..."
    sleep "${sleep_seconds}"
  done

  echo "[backend] Database migrations applied."
  return 0
}

if is_truthy "${SKIP_MIGRATIONS:-0}"; then
  echo "[backend] SKIP_MIGRATIONS habilitado. Migrations não serão executadas."
else
  run_migrations 10 5
fi

echo "[backend] Ensuring admin seed..."
node dist/prisma/seed-admin.js || true

echo "[backend] Starting Megga Bolão API"
exec node dist/main.js
