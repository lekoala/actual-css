import { readFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const GROUPS = [
  {
    name: "soft-recipe",
    files: [
      "src/css/variants.css",
      "src/css/components/alert.css",
    ],
  },
  {
    name: "intent-boundary",
    files: [
      "src/css/components/alert.css",
      "src/css/components/avatar.css",
      "src/css/components/badge.css",
      "src/css/components/button.css",
      "src/css/components/card.css",
      "src/css/components/meter.css",
      "src/css/components/overline.css",
      "src/css/components/progress.css",
      "src/css/components/spinner.css",
      "src/css/components/tab.css",
      "src/css/forms/choice.css",
      "src/css/forms/choice-card.css",
      "src/css/forms/range.css",
      "src/css/forms/switch.css",
    ],
  },
];

function normalizeBlock(block) {
  return block
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([:;,()])\s*/g, "$1")
    .trim();
}

function extractMarkedBlocks(source, marker) {
  const token = `/* @sync ${marker} */`;
  const blocks = [];
  let cursor = 0;

  while (true) {
    const start = source.indexOf(token, cursor);
    if (start === -1) break;

    const contentStart = start + token.length;
    const end = source.indexOf(token, contentStart);
    if (end === -1) {
      throw new Error(`Missing closing sync marker for ${marker}.`);
    }

    blocks.push(source.slice(contentStart, end));
    cursor = end + token.length;
  }

  return blocks;
}

async function readBlocks(group) {
  const blocks = [];

  for (const file of group.files) {
    const fullPath = join(ROOT, file);
    const source = await readFile(fullPath, "utf8");
    const marked = extractMarkedBlocks(source, group.name);

    for (const block of marked) {
      blocks.push({
        file,
        normalized: normalizeBlock(block),
      });
    }
  }

  return blocks;
}

async function main() {
  let failed = false;

  for (const group of GROUPS) {
    const blocks = await readBlocks(group);

    if (blocks.length !== group.files.length) {
      failed = true;
      console.error(
        `Sync check failed for ${group.name}: expected ${group.files.length} blocks, found ${blocks.length}.`,
      );
      continue;
    }

    const [first, ...rest] = blocks;
    const divergent = rest.filter((block) => block.normalized !== first.normalized);

    if (divergent.length > 0) {
      failed = true;
      console.error(`Sync check failed for ${group.name}.`);
      console.error(`Reference: ${relative(ROOT, join(ROOT, first.file))}`);
      for (const block of divergent) {
        console.error(`Diverged: ${relative(ROOT, join(ROOT, block.file))}`);
      }
    }
  }

  if (failed) {
    process.exit(1);
  }

  console.log(`Sync check passed (${GROUPS.length} group).`);
}

main();
