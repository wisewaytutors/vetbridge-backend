#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set. Add it in Render → Environment."
  exit 1
fi

echo "Applying database schema..."
npx prisma db push --skip-generate

echo "Starting VetBridge API..."
exec node src/server.js
