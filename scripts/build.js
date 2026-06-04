import fs from 'node:fs/promises';
import path from 'node:path';
import { parseComponentMarkdown } from './markdown-parser.js';
import { generateComponentPage } from './templates/component-page.js';
import { generateComponentsIndex } from './templates/components-index.js';

const root = process.cwd();
const entry = path.join(root, 'src', 'actual.css');
const distDir = path.join(root, 'dist');
const themeSrcDir = path.join(root, 'src', 'themes');
const themeDistDir = path.join(distDir, 'themes');
const outFile = path.join(distDir, 'actual.css');
const minFile = path.join(distDir, 'actual.min.css');
const docsDir = path.join(root, 'docs', 'components');
const demoComponentsDir = path.join(root, 'demo', 'components');

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

async function buildCss() {
  await fs.mkdir(distDir, { recursive: true });
  await fs.mkdir(themeDistDir, { recursive: true });
  const banner = '/* Actual CSS v0.1.0 | plain CSS component framework */\n';
  const css = banner + await inlineCss(entry);
  await fs.writeFile(outFile, css);
  await fs.writeFile(minFile, banner + minify(css));

  const themeFiles = (await fs.readdir(themeSrcDir))
    .filter((file) => file.endsWith('.css'))
    .sort();

  for (const themeFile of themeFiles) {
    const source = path.join(themeSrcDir, themeFile);
    const output = path.join(themeDistDir, themeFile);
    const parsed = path.parse(themeFile);
    const minOutput = path.join(themeDistDir, `${parsed.name}.min.css`);
    const themeCss = banner + await inlineCss(source);
    await fs.writeFile(output, themeCss);
    await fs.writeFile(minOutput, banner + minify(themeCss));
  }

  console.log(
    `Built ${path.relative(root, outFile)}, ${path.relative(root, minFile)}, and ${themeFiles.length} themes`
  );
}

async function buildDocs() {
  const mdFiles = (await fs.readdir(docsDir))
    .filter((file) => file.endsWith('.md'))
    .sort();

  const components = [];
  await fs.mkdir(demoComponentsDir, { recursive: true });

  for (const mdFile of mdFiles) {
    const name = path.parse(mdFile).name;
    const mdPath = path.join(docsDir, mdFile);
    const md = await fs.readFile(mdPath, 'utf8');
    const data = parseComponentMarkdown(md);
    components.push({ name, ...data });

    // Generate demo page from markdown
    const demoPath = path.join(demoComponentsDir, `${name}.html`);
    const html = generateComponentPage(data, name);
    await fs.writeFile(demoPath, html);
  }

  // Generate components index
  const indexPath = path.join(demoComponentsDir, 'index.html');
  const indexHtml = generateComponentsIndex(components);
  await fs.writeFile(indexPath, indexHtml);

  console.log(`Generated ${mdFiles.length} demo pages from markdown docs`);
}

async function build() {
  await buildCss();
  await buildDocs();
}

await build();

if (process.argv.includes('--watch')) {
  const watcher = fs.watch(docsDir, { recursive: true });
  console.log('Watching docs/components/ ...');
  for await (const event of watcher) {
    if (event.filename?.endsWith('.md')) {
      console.log(`\n${event.filename} changed, regenerating...`);
      try { await buildDocs(); } catch (error) { console.error(error); }
    }
  }
}
