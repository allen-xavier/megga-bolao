#!/bin/sh
set -euo pipefail

if [ -n "${TZ:-}" ]; then
  ln -snf "/usr/share/zoneinfo/$TZ" /etc/localtime && echo "$TZ" > /etc/timezone || true
fi

echo "[backend] Running database migrations..."
npx prisma migrate deploy

echo "[backend] Ensuring admin seed..."
node dist/prisma/seed-admin.js || true

echo "[backend] Starting Megga Bolão API"
exec node dist/main.js

