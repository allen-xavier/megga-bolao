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

if is_truthy "${SKIP_DB_WAIT:-0}"; then
  echo "[backend] SKIP_DB_WAIT habilitado. Ignorando verificação de disponibilidade do banco."
else
  wait_for_database() {
    local attempt=1
    local max_attempts=${1:-30}
    local sleep_seconds=${2:-2}

    local parsed
    if ! parsed=$(node <<'NODE'
const { DATABASE_URL } = process.env;
try {
  const url = new URL(DATABASE_URL);
  const encode = (value = '') => Buffer.from(value, 'utf8').toString('base64');
  const clean = new URL(DATABASE_URL);
  clean.search = '';
  clean.hash = '';
  const payload = [
    url.hostname,
    url.port || '5432',
    url.pathname.slice(1),
    url.username,
    url.password,
    clean.toString()
  ]
    .map(encode)
    .join(' ');
  process.stdout.write(payload);
} catch (error) {
  process.stderr.write(error.message);
  process.exit(1);
}
NODE
); then
      echo "[backend] Não foi possível interpretar DATABASE_URL: ${parsed}" >&2
      return 1
    fi

    local host_b64 port_b64 db_b64 user_b64 pass_b64 dsn_b64
    read -r host_b64 port_b64 db_b64 user_b64 pass_b64 dsn_b64 <<<"${parsed}"

    decode() {
      if [ -z "$1" ]; then
        echo ""
      else
        printf '%s' "$1" | base64 --decode
      fi
    }

    local db_host db_port db_name db_user db_pass
    db_host=$(decode "$host_b64")
    db_port=$(decode "$port_b64")
    if [ -z "$db_port" ]; then
      db_port="5432"
    fi
    db_name=$(decode "$db_b64")
    db_user=$(decode "$user_b64")
    db_pass=$(decode "$pass_b64")

    if [ -z "$db_host" ] || [ -z "$db_name" ]; then
      echo "[backend] Informações insuficientes para aguardar pelo banco." >&2
      return 1
    fi

    if [ -n "$db_pass" ]; then
      export PGPASSWORD="$db_pass"
    else
      unset PGPASSWORD || true
    fi

    echo "[backend] Aguardando disponibilidade do banco de dados (${db_host}:${db_port}/${db_name})..."

    local psql_args=("-h" "$db_host" "-p" "$db_port" "-d" "$db_name" "-c" 'SELECT 1')
    if [ -n "$db_user" ]; then
      psql_args=("-U" "$db_user" "${psql_args[@]}")
    fi

    until PGPASSWORD="$db_pass" psql "${psql_args[@]}" >/dev/null 2>&1; do
      echo "[backend] Banco indisponível (tentativa ${attempt}/${max_attempts}). Aguardando ${sleep_seconds}s..."

      if (( attempt >= max_attempts )); then
        echo "[backend] Banco não respondeu após ${max_attempts} tentativas." >&2
        return 1
      fi

      attempt=$(( attempt + 1 ))
      sleep "${sleep_seconds}"
    done

    echo "[backend] Banco de dados disponível."
    return 0
  }

  wait_for_database 30 2 || exit 1
fi

if is_truthy "${SKIP_MIGRATIONS:-0}"; then
  echo "[backend] SKIP_MIGRATIONS habilitado. Migrations não serão executadas."
else
  run_migrations 10 5
fi

echo "[backend] Ensuring admin seed..."
node dist/prisma/seed-admin.js || true

echo "[backend] Starting Megga Bolão API"
exec node dist/main.js
