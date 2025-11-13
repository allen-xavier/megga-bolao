#!/usr/bin/env node
const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const localModules = path.resolve(__dirname, '../local_modules');
const existingNodePath = process.env.NODE_PATH;
process.env.NODE_PATH = existingNodePath
  ? `${localModules}${path.delimiter}${existingNodePath}`
  : localModules;

const eslintPackageJson = require.resolve('eslint/package.json');
const eslintDir = path.dirname(eslintPackageJson);
const eslintBin = path.join(eslintDir, 'bin', 'eslint.js');

if (!fs.existsSync(eslintBin)) {
  console.error('Unable to locate the ESLint CLI entry point.');
  process.exit(1);
}

const args = process.argv.slice(2);
const child = spawn(process.execPath, [eslintBin, ...args], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code) => {
  process.exit(code);
});
