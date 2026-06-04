import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const entry = path.join(root, 'src', 'actual.css');
const distDir = path.join(root, 'dist');
const outFile = path.join(distDir, 'actual.css');
const minFile = path.join(distDir, 'actual.min.css');

async function inlineCss(file, seen = new Set()) {
  const abs = path.resolve(file);
  if (seen.has(abs)) return '';
  seen.add(abs);

  const dir = path.dirname(abs);
  const css = await fs.readFile(abs, 'utf8');
  const lines = [];

  for (const line of css.split('\n')) {
    const match = line.match(/^@import\s+["'](.+?)["'];/);
    if (match) {
      const imported = path.resolve(dir, match[1]);
      lines.push(`/* ${path.relative(root, imported)} */`);
      lines.push(await inlineCss(imported, seen));
    } else {
      lines.push(line);
    }
  }

  return lines.join('\n');
}

function minify(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

async function build() {
  await fs.mkdir(distDir, { recursive: true });
  const banner = '/* Actual CSS v0.1.0 | plain CSS component framework */\n';
  const css = banner + await inlineCss(entry);
  await fs.writeFile(outFile, css);
  await fs.writeFile(minFile, banner + minify(css));
  console.log(`Built ${path.relative(root, outFile)} and ${path.relative(root, minFile)}`);
}

await build();

if (process.argv.includes('--watch')) {
  const watcher = fs.watch(path.join(root, 'src'), { recursive: true });
  console.log('Watching src/ ...');
  for await (const event of watcher) {
    if (event.filename?.endsWith('.css')) {
      try { await build(); } catch (error) { console.error(error); }
    }
  }
}
