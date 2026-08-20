import { readFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const GROUPS = [
  {
    name: "soft-recipe",
    files: [
      "src/css/core/variants.css",
      "src/css/components/alert.css",
      "src/css/components/badge.css",
    ],
  },
  {
    name: "key-recipe",
    files: ["src/css/typography/prose.css", "src/css/components/key.css"],
  },
];

function normalizeBlock(block) {
  return block
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(?:\.key|\.prose :where\(kbd\))\s*\{/g, ".key {")
    .replace(/--(?:ui|alert-default|badge-default)-(bg|border)\s*:/g, "--soft-$1:")
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
