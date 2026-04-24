#!/usr/bin/env node

const { spawn } = require('child_process');
const { existsSync } = require('fs');
const { resolve } = require('path');

const candidateEntryPoints = ['dist/main.js', 'dist/src/main.js'];

const entrypoint = candidateEntryPoints
  .map((relativePath) => resolve(process.cwd(), relativePath))
  .find((absolutePath) => existsSync(absolutePath));

if (!entrypoint) {
  console.error(
    `[start:prod] Unable to find a compiled Nest entrypoint. Tried: ${candidateEntryPoints.join(', ')}`,
    `Unable to find a compiled Nest entrypoint. Tried: ${candidateEntryPoints.join(', ')}`,
  );
  process.exit(1);
}

console.log(`[start:prod] Launching ${entrypoint}`);

const child = spawn(process.execPath, [entrypoint, ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});

child.on('error', (error) => {
  console.error(`[start:prod] Failed to launch ${entrypoint}:`, error);
  process.exit(1);
});
