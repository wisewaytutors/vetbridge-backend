'use strict';

const fs = require('fs');
const { execSync } = require('child_process');

const schemaPath = 'prisma/schema.prisma';

if (!fs.existsSync(schemaPath)) {
  console.log('[postinstall] prisma/schema.prisma not found — skipping prisma generate');
  process.exit(0);
}

console.log('[postinstall] Generating Prisma Client…');
execSync('npx prisma generate', { stdio: 'inherit' });
