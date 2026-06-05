import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

async function listBaseNames(relativePath) {
  const entries = await fs.readdir(path.join(root, relativePath));
  return entries
    .filter((entry) => entry.endsWith('.css') || entry.endsWith('.md'))
    .map((entry) => entry.replace(/\.(css|md)$/, ''))
    .sort();
}

async function read(relativePath) {
  return fs.readFile(path.join(root, relativePath), 'utf8');
}

test('component docs and contracts stay in sync with component CSS files', async () => {
  const components = await listBaseNames('src/components');
  const docs = await listBaseNames('docs/components');

  assert.deepEqual(docs, components);
});

test('component CSS files keep concise local contract headers', async () => {
  const components = await listBaseNames('src/components');

  for (const component of components) {
    const text = await read(path.join('src', 'components', `${component}.css`));
    const header = text.match(/^\/\*\*[\s\S]*?\*\//)?.[0];
    const nonEmptyLines = header?.split(/\r?\n/).filter((line) => line.trim().length > 0) ?? [];

    assert.ok(header, `${component}.css should start with a local contract header`);
    assert.match(header, /\* Contract:/, `${component}.css should describe its contract`);
    assert.match(header, /\* Owns:/, `${component}.css should describe ownership`);
    assert.match(header, /\* Does not own:/, `${component}.css should describe non-ownership`);
    assert.ok(nonEmptyLines.length <= 7, `${component}.css local contract header should stay lean`);
  }
});
