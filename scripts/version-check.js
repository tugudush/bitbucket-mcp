#!/usr/bin/env node

/**
 * Version Check Script
 * Displays the current version from package.json and checks consistency with src/version.ts
 * Usage: node scripts/version-check.js
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

// Read current version from package.json
const pkgPath = resolve(rootDir, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const pkgVersion = pkg.version;

// Read version from src/version.ts
const versionTsPath = resolve(rootDir, 'src/version.ts');
const versionTsContent = readFileSync(versionTsPath, 'utf8');
const versionTsMatch = versionTsContent.match(/export const VERSION = '([^']+)';/);
const versionTsVersion = versionTsMatch ? versionTsMatch[1] : null;

console.log(`Current version: ${pkgVersion}`);

// Check for inconsistencies
if (!versionTsVersion) {
  console.error('❌ Error: Could not find VERSION in src/version.ts');
  process.exit(1);
}

if (pkgVersion !== versionTsVersion) {
  console.error(`❌ Version mismatch detected:`);
  console.error(`   package.json:    ${pkgVersion}`);
  console.error(`   src/version.ts:  ${versionTsVersion}`);
  console.error('\nRun version increment script to fix.');
  process.exit(1);
}

console.log('✅ Version consistent across all files');
