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

readarray -t DB_INFO < <(node <<'NODE'
const { URL } = require('url');
const dbUrl = new URL(process.env.DATABASE_URL);
const dbName = dbUrl.pathname.replace(/^\//, '').split('?')[0] || process.env.DB_NAME || '';
console.log(dbUrl.username || process.env.DB_USER || '');
console.log(dbUrl.password || process.env.DB_PASSWORD || '');
console.log(dbUrl.hostname || process.env.DB_HOST || 'localhost');
console.log(dbUrl.port || process.env.DB_PORT || '5432');
console.log(dbName);
NODE
)

DB_USER="${DB_INFO[0]:-postgres}"
DB_PASSWORD="${DB_INFO[1]:-}"
DB_HOST="${DB_INFO[2]:-localhost}"
DB_PORT="${DB_INFO[3]:-5432}"
DB_NAME="${DB_INFO[4]:-postgres}"

export PGPASSWORD="${DB_PASSWORD}"

wait_for_db() {
  local attempt=1
  local max_attempts=${1:-20}
  local sleep_seconds=${2:-3}

  echo "[backend] Waiting for database (${DB_HOST}:${DB_PORT}/${DB_NAME}) to accept connections..."
  while (( attempt <= max_attempts )); do
    if pg_isready -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" >/dev/null 2>&1; then
      if psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -Atqc 'SELECT 1;' >/dev/null 2>&1; then
        echo "[backend] Database connection established."
        return 0
      fi
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
  local sleep_seconds=${2:-5}

  # Clean failed migrations (P3009) so we can reapply with fixed SQL
  if command -v psql >/dev/null 2>&1; then
    psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" <<'SQL' || true
DELETE FROM "_prisma_migrations"
WHERE migration_name IN ('20251215_results_and_sena_pot', '20251215_affiliate_config')
  AND finished_at IS NULL;
SQL
  fi

  echo "[backend] Running database migrations..."
  while (( attempt <= max_attempts )); do
    if npx prisma migrate deploy; then
      echo "[backend] Database migrations applied."
      return 0
    fi

    echo "[backend] Migration attempt ${attempt}/${max_attempts} failed."
    attempt=$(( attempt + 1 ))

    if (( attempt <= max_attempts )); then
      echo "[backend] Re-checking database health before retrying migrations..."
      wait_for_db 10 "${sleep_seconds}"
      echo "[backend] Retrying migrations in ${sleep_seconds}s..."
      sleep "${sleep_seconds}"
    fi
  done

  echo "[backend] Failed to apply migrations after ${max_attempts} attempts."
  return 1
}

if is_truthy "${SKIP_DB_WAIT:-0}"; then
  echo "[backend] SKIP_DB_WAIT habilitado. Pulando verifica??o do banco."
else
  wait_for_db 60 2
fi

if is_truthy "${SKIP_MIGRATIONS:-0}"; then
  echo "[backend] SKIP_MIGRATIONS habilitado. Migrations n?o ser?o executadas."
else
  run_migrations 5 5
fi

echo "[backend] Ensuring admin seed..."
node dist/prisma/seed-admin.js || node dist/prisma/seed.js || true

echo "[backend] Starting Megga Bol?o API"
exec node dist/main.js
