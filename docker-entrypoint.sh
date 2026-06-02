#!/bin/sh
set -e

# Render may expose the DB URL under different keys depending on how it was linked
if [ -z "$DATABASE_URL" ]; then
  if [ -n "$DATABASE_URL_PRIVATE" ]; then
    export DATABASE_URL="$DATABASE_URL_PRIVATE"
  elif [ -n "$POSTGRES_URL" ]; then
    export DATABASE_URL="$POSTGRES_URL"
  fi
fi

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set on this web service."
  echo ""
  echo "Fix on Render:"
  echo "  1. Open your PostgreSQL service → Connect → copy Internal Database URL"
  echo "  2. Open THIS web service → Environment → Add DATABASE_URL = that URL"
  echo "  3. Save (wait for redeploy)"
  echo ""
  echo "Or: Web service → Connections → Link your Postgres database"
  echo ""
  echo "DB-related env vars present (keys only):"
  env | grep -E '^(DATABASE|POSTGRES|PG)' | cut -d= -f1 | sort -u || echo "  (none)"
  exit 1
fi

echo "Applying database schema..."
npx prisma db push --skip-generate

echo "Starting VetBridge API..."
exec node src/server.js
