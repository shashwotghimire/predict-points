#!/usr/bin/env node

const { existsSync } = require('fs');
const { resolve } = require('path');

const candidateEntryPoints = ['dist/main.js', 'dist/src/main.js'];

const entrypoint = candidateEntryPoints
  .map((relativePath) => resolve(process.cwd(), relativePath))
  .find((absolutePath) => existsSync(absolutePath));

if (!entrypoint) {
  console.error(
    `Unable to find a compiled Nest entrypoint. Tried: ${candidateEntryPoints.join(', ')}`,
  );
  process.exit(1);
}

require(entrypoint);
