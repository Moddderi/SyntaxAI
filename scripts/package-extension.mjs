#!/usr/bin/env node
/**
 * Zips a built extension for store upload.
 *
 *   node scripts/package-extension.mjs chrome    -> release/syntaxai-chrome-<version>.zip
 *   node scripts/package-extension.mjs firefox   -> release/syntaxai-firefox-<version>.zip
 *
 * Run `npm run build:chrome` / `npm run build:firefox` first (the npm `package:*` scripts do).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = process.argv[2];

const TARGETS = {
  chrome: { dir: 'dist', manifest: 'manifest.json' },
  firefox: { dir: 'dist-firefox', manifest: 'manifest.firefox.json' },
};

if (!(target in TARGETS)) {
  console.error('Usage: node scripts/package-extension.mjs <chrome|firefox>');
  process.exit(1);
}

const { dir, manifest } = TARGETS[target];
const buildDir = resolve(root, dir);

if (!existsSync(resolve(buildDir, 'manifest.json'))) {
  console.error(`Missing ${dir}/manifest.json — build the ${target} extension first.`);
  process.exit(1);
}

const packageVersion = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')).version;
const manifestVersion = JSON.parse(readFileSync(resolve(root, manifest), 'utf8')).version;

if (packageVersion !== manifestVersion) {
  console.error(
    `Version mismatch: package.json=${packageVersion} but ${manifest}=${manifestVersion}. Align them before packaging.`,
  );
  process.exit(1);
}

const releaseDir = resolve(root, 'release');
mkdirSync(releaseDir, { recursive: true });

const zipPath = resolve(releaseDir, `syntaxai-${target}-${manifestVersion}.zip`);
rmSync(zipPath, { force: true });

// -X: no extra file attributes, -r: recurse, exclude OS junk and source maps.
execFileSync('zip', ['-r', '-X', zipPath, '.', '-x', '*.DS_Store', '-x', '*.map'], {
  cwd: buildDir,
  stdio: 'inherit',
});

console.log(`\nCreated ${zipPath}`);
