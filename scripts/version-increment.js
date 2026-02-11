#!/usr/bin/env node

/**
 * Version Increment Script
 * Increments the version in package.json, src/index.ts, and src/api.ts
 * Usage: node scripts/version-increment.js <major|minor|patch>
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

const type = process.argv[2];
if (!['major', 'minor', 'patch'].includes(type)) {
  console.error('Usage: node scripts/version-increment.js <major|minor|patch>');
  process.exit(1);
}

// Read current version from package.json
const pkgPath = resolve(rootDir, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const [major, minor, patch] = pkg.version.split('.').map(Number);

// Calculate new version
let newVersion;
switch (type) {
  case 'major':
    newVersion = `${major + 1}.0.0`;
    break;
  case 'minor':
    newVersion = `${major}.${minor + 1}.0`;
    break;
  case 'patch':
    newVersion = `${major}.${minor}.${patch + 1}`;
    break;
}

console.log(`Bumping version: ${pkg.version} → ${newVersion} (${type})`);

// Files to update with their version patterns
const files = [
  {
    path: pkgPath,
    find: `"version": "${pkg.version}"`,
    replace: `"version": "${newVersion}"`,
  },
  {
    path: resolve(rootDir, 'src/version.ts'),
    find: `export const VERSION = '${pkg.version}';`,
    replace: `export const VERSION = '${newVersion}';`,
  },
];

let hasErrors = false;
for (const file of files) {
  const content = readFileSync(file.path, 'utf8');
  if (!content.includes(file.find)) {
    console.error(`⚠️  Could not find version string in ${file.path}`);
    hasErrors = true;
    continue;
  }
  writeFileSync(file.path, content.replace(file.find, file.replace), 'utf8');
  console.log(`✅ Updated ${file.path.replace(rootDir, '.')}`);
}

if (hasErrors) {
  console.error('\n❌ Some files were not updated. Please check manually.');
  process.exit(1);
}

console.log(`\n✅ Version bumped to ${newVersion}`);
console.log('   All files updated consistently.');
