'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const required = [
  'Dockerfile',
  'prisma/schema.prisma',
  'package.json',
  'src/server.js',
];

let failed = false;

for (const file of required) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) {
    console.error(`MISSING: ${file}`);
    failed = true;
  }
}

const dockerfile = fs.readFileSync(path.join(root, 'Dockerfile'), 'utf8');
const lines = dockerfile.split('\n').length;

if (lines < 12) {
  console.error(`Dockerfile looks outdated (${lines} lines). Push the full Dockerfile from this repo.`);
  failed = true;
}

if (!dockerfile.includes('COPY prisma/schema.prisma')) {
  console.error('Dockerfile must COPY prisma/schema.prisma before npm install.');
  failed = true;
}

if (dockerfile.includes('RUN npx prisma generate') && dockerfile.indexOf('COPY prisma/schema.prisma') > dockerfile.indexOf('RUN npx prisma generate')) {
  console.error('Dockerfile order wrong: copy schema before prisma generate.');
  failed = true;
}

if (failed) {
  process.exit(1);
}

console.log('Deploy files OK — safe to git push.');
