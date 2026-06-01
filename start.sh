#!/bin/sh
set -e
echo "🐾 VetBridge starting..."
echo "Running database migrations..."
npx prisma migrate deploy
echo "✅ Migrations complete"
exec node src/server.js
