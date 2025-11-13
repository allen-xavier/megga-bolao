#!/bin/bash
set -euo pipefail

if [ -n "${TZ:-}" ]; then
  ln -snf "/usr/share/zoneinfo/$TZ" /etc/localtime && echo "$TZ" > /etc/timezone || true
fi

wait_for_db() {
  local attempt=1
  local max_attempts=${1:-20}
  local sleep_seconds=${2:-3}

  echo "[backend] Waiting for database to accept connections..."
  while (( attempt <= max_attempts )); do
    if npx prisma db execute --schema prisma/schema.prisma --script "SELECT 1" >/dev/null 2>&1; then
      echo "[backend] Database connection established."
      return 0
    fi

    echo "[backend] Database not ready (attempt ${attempt}/${max_attempts}). Retrying in ${sleep_seconds}s..."
    attempt=$(( attempt + 1 ))
    sleep "${sleep_seconds}"
  done

  echo "[backend] Could not connect to the database after ${max_attempts} attempts."
  return 1
}

run_migrations() {
  local attempt=1
  local max_attempts=${1:-5}
  local sleep_seconds=${2:-3}

  echo "[backend] Running database migrations..."
  while (( attempt <= max_attempts )); do
    if npx prisma migrate deploy; then
      echo "[backend] Database migrations applied."
      return 0
    fi

    echo "[backend] Migration attempt ${attempt}/${max_attempts} failed. Retrying in ${sleep_seconds}s..."
    attempt=$(( attempt + 1 ))
    sleep "${sleep_seconds}"
  done

  echo "[backend] Failed to apply migrations after ${max_attempts} attempts."
  return 1
}

wait_for_db 40 3
run_migrations 5 5

echo "[backend] Ensuring admin seed..."
node dist/prisma/seed-admin.js || true

echo "[backend] Starting Megga Bolão API"
exec node dist/main.js
