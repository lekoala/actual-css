import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { generateProjectMap } from '../../scripts/project-map.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

async function read(relativePath) {
  return fs.readFile(path.join(root, relativePath), 'utf8');
}

test('actual.css keeps architecture import order', async () => {
  const css = await read('src/actual.css');
  const imports = css
    .split(/\r?\n/)
    .filter((line) => line.startsWith('@import'))
    .map((line) => line.match(/"([^"]+)"/)[1]);

  assert.deepEqual(imports.slice(0, 5), [
    './reset.css',
    './tokens.css',
    './themes.css',
    './intents.css',
    './layout.css'
  ]);

  const variantsIndex = imports.indexOf('./variants.css');
  const enhancementIndex = imports.indexOf('./enhancements/color-mix.css');
  const componentIndexes = imports
    .map((value, index) => ({ value, index }))
    .filter((entry) => entry.value.startsWith('./components/'))
    .map((entry) => entry.index);

  assert.ok(componentIndexes.length > 0, 'expected component imports in actual.css');
  assert.ok(variantsIndex > Math.max(...componentIndexes), 'variants.css should load after components');
  assert.ok(enhancementIndex > variantsIndex, 'enhancements should load after variants.css');
  assert.deepEqual(imports.slice(-3), [
    './enhancements/color-mix.css',
    './enhancements/container.css',
    './enhancements/base-select.css'
  ]);
});

test('contributor docs keep the fast and full verification split explicit', async () => {
  const quality = await read('QUALITY.md');
  const agents = await read('AGENTS.md');

  assert.match(quality, /npm run verify\b/);
  assert.match(quality, /npm run verify:ci\b/);
  assert.match(quality, /npm run test:visual\b/);
  assert.match(agents, /The harness decides done\./);
  assert.match(agents, /## Ceremony Budget/);
  assert.match(agents, /ARCHITECTURE\.md/);
  assert.match(agents, /Do not run verification commands manually;/);
});

test('core architectural rules explain rationale and exceptions', async () => {
  const architecture = await read('ARCHITECTURE.md');

  assert.match(architecture, /### Components Consume Shared Semantic Variables/);
  assert.match(architecture, /### Foreground Tokens Stay Explicit/);
  assert.match(architecture, /### Defaults Use Low Specificity/);
  assert.match(architecture, /### Avoid Forceful Or Legacy APIs/);
  assert.match(architecture, /### Transparent Hover States Use Shared Variables/);
  assert.equal((architecture.match(/^Rule:$/gm) ?? []).length, 5);
  assert.equal((architecture.match(/^Reason:$/gm) ?? []).length, 5);
  assert.equal((architecture.match(/^Allowed exceptions:$/gm) ?? []).length, 5);
  assert.match(architecture, /## Source Of Truth/);
});

test('project map stays generated from repo conventions', async () => {
  const projectMap = await read('docs/PROJECT_MAP.md');
  const generated = await generateProjectMap();
  const packageJson = await read('package.json');

  assert.equal(projectMap, generated);
  assert.match(projectMap, /^Generated from `src\/actual\.css`, `ARCHITECTURE\.md`, `docs\/components\/`, and local contract headers in `src\/components\/\*\.css`\./m);
  assert.match(projectMap, /- local contract headers in `src\/components\/\*\.css`/);
  assert.match(projectMap, /\| Order \| Component \| Category \| Source \| Docs \|/);
  assert.match(projectMap, /`src\/themes\.css`, `src\/themes\/\*\.css`/);
  assert.match(packageJson, /"map": "node scripts\/project-map\.js"/);
});
