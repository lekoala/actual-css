import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const srcDir = path.join(root, 'src');
const allowedColorFiles = new Set([
  path.join(srcDir, 'tokens.css'),
  path.join(srcDir, 'themes.css'),
  path.join(srcDir, 'enhancements', 'color-mix.css')
]);
const themesDir = path.join(srcDir, 'themes');

const problems = [];

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (entry.name.endsWith('.css')) files.push(full);
  }
  return files;
}

for (const file of await walk(srcDir)) {
  const css = await fs.readFile(file, 'utf8');
  const rel = path.relative(root, file);

  if (/\.btn-primary|\.badge-primary|\.alert-primary/.test(css)) {
    problems.push(`${rel}: forbidden component-specific variant class`);
  }

  if (/!important/.test(css) && !/reset\.css$/.test(rel)) {
    problems.push(`${rel}: avoid !important outside reduced-motion reset`);
  }

  if (
    !allowedColorFiles.has(file) &&
    !file.startsWith(themesDir + path.sep) &&
    /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|\boklch\(/.test(css)
  ) {
    problems.push(`${rel}: hard-coded color outside token/theme/enhancement files`);
  }
}

if (problems.length) {
  console.error('CSS checks failed:\n' + problems.map(p => `- ${p}`).join('\n'));
  process.exit(1);
}

console.log('CSS checks passed.');
