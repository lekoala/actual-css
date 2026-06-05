import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputFile = path.join(rootDir, 'docs', 'PROJECT_MAP.md');

async function read(relativePath) {
  return fs.readFile(path.join(rootDir, relativePath), 'utf8');
}

async function listMarkdownBaseNames(relativePath) {
  const entries = await fs.readdir(path.join(rootDir, relativePath), { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name.replace(/\.md$/, ''))
    .sort();
}

function hasLocalContractHeader(css) {
  const header = css.match(/^\/\*\*[\s\S]*?\*\//)?.[0];

  if (!header) {
    return false;
  }

  return /\* Contract:/m.test(header) && /\* Owns:/m.test(header) && /\* Does not own:/m.test(header);
}

function parseImports(css) {
  return css
    .split(/\r?\n/)
    .filter((line) => line.startsWith('@import'))
    .map((line) => line.match(/"([^"]+)"/)[1]);
}

function parseArchitectureLayers(architecture) {
  const match = architecture.match(/## Layers\n\n([\s\S]*?)\n## /);

  if (!match) {
    return [];
  }

  return match[1]
    .split(/\r?\n/)
    .map((line) => {
      const summary = line.match(/^\d+\. .+?: (.+)$/)?.[1];
      const files = [...line.matchAll(/`([^`]+)`/g)].map((match) => match[1]);

      if (!summary || files.length === 0) {
        return null;
      }

      return {
        files,
        summary
      };
    })
    .filter(Boolean);
}

function parseTaxonomy(architecture) {
  const match = architecture.match(/## Component Taxonomy\n\n([\s\S]*?)\n## /);

  if (!match) {
    return new Map();
  }

  const categoryMap = new Map();

  for (const line of match[1].split(/\r?\n/)) {
    const parsed = line.match(/^- ([^:]+): `([^`]+)`(?:, `([^`]+)`)*(.*)$/);

    if (!parsed) {
      continue;
    }

    const category = parsed[1].trim().toLowerCase();
    const names = [...line.matchAll(/`([^`]+)`/g)].map((match) => match[1]);

    for (const name of names) {
      categoryMap.set(name, category);
    }
  }

  return categoryMap;
}

function buildWarnings({ components, docs, localContracts, categoryMap }) {
  const warnings = [];

  for (const component of components) {
    if (!docs.includes(component)) {
      warnings.push(`Missing docs/components/${component}.md`);
    }

    if (!localContracts.get(component)) {
      warnings.push(`Missing local contract header in src/components/${component}.css`);
    }

    if (!categoryMap.has(component)) {
      warnings.push(`Missing taxonomy entry for ${component} in ARCHITECTURE.md`);
    }
  }

  for (const doc of docs) {
    if (!components.includes(doc)) {
      warnings.push(`Orphan docs/components/${doc}.md`);
    }
  }

  return warnings;
}

export async function generateProjectMap() {
  const [actualCss, architecture, docs] = await Promise.all([
    read('src/actual.css'),
    read('ARCHITECTURE.md'),
    listMarkdownBaseNames(path.join('docs', 'components'))
  ]);

  const imports = parseImports(actualCss);
  const layers = parseArchitectureLayers(architecture);
  const categoryMap = parseTaxonomy(architecture);
  const components = imports
    .filter((entry) => entry.startsWith('./components/'))
    .map((entry) => path.basename(entry, '.css'));
  const componentFiles = await Promise.all(
    components.map(async (component) => {
      return [component, await read(path.join('src', 'components', `${component}.css`))];
    })
  );
  const localContracts = new Map(
    componentFiles.map(([component, css]) => [component, hasLocalContractHeader(css)])
  );
  const enhancements = imports
    .filter((entry) => entry.startsWith('./enhancements/'))
    .map((entry) => entry.replace('./', 'src/'));
  const warnings = buildWarnings({ components, docs, localContracts, categoryMap });

  const lines = [
    '# Project Map',
    '',
    'Generated from `src/actual.css`, `ARCHITECTURE.md`, `docs/components/`, and local contract headers in `src/components/*.css`. Do not edit manually.',
    '',
    '## Main Entry Points',
    '',
    '- `src/actual.css`',
    '- local contract headers in `src/components/*.css`',
    '- `docs/components/*.md`',
    '- `demo/index.html`',
    '- `demo/components/index.html`',
    '',
    '## Layers',
    '',
    '| File | Summary |',
    '| --- | --- |'
  ];

  for (const layer of layers) {
    const fileCell = layer.files.map((file) => `\`${file}\``).join(', ');
    lines.push(`| ${fileCell} | ${layer.summary} |`);
  }

  lines.push('');
  lines.push('## Components');
  lines.push('');
  lines.push('| Order | Component | Category | Source | Docs |');
  lines.push('| --- | --- | --- | --- | --- |');

  components.forEach((component, index) => {
    lines.push(
      `| ${index + 1} | ${component} | ${categoryMap.get(component) ?? 'uncategorized'} | \`src/components/${component}.css\` | \`docs/components/${component}.md\` |`
    );
  });

  lines.push('');
  lines.push('## Enhancements');
  lines.push('');

  for (const enhancement of enhancements) {
    lines.push(`- \`${enhancement}\``);
  }

  lines.push('');
  lines.push('## Warnings');
  lines.push('');

  if (warnings.length === 0) {
    lines.push('None.');
  } else {
    for (const warning of warnings) {
      lines.push(`- ${warning}`);
    }
  }

  lines.push('');
  return lines.join('\n');
}

async function writeProjectMap() {
  const markdown = await generateProjectMap();
  await fs.writeFile(outputFile, markdown);
  console.log('Wrote docs/PROJECT_MAP.md');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await writeProjectMap();
}
