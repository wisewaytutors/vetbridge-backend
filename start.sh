#!/bin/sh
set -e
echo "🐾 VetBridge starting..."
echo "Running database migrations..."
npx prisma db push --skip-generate
echo "✅ Migrations complete"
exec node src/server.js
