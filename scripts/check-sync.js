import { readFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

/* soft-tint: the translucent fill and rim of the components that own one.
   soft-ink: the soft text, shared by that tint and the opaque .soft. */
const GROUPS = [
  {
    name: "soft-tint",
    files: [
      "src/css/components/alert.css",
      "src/css/components/badge.css",
      "src/css/components/button.css",
    ],
  },
  {
    name: "soft-ink",
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

/* Selector-list groups: the .sm and .lg size rules cover different
   declarations, so block equality cannot guard them. Instead the participant
   lists must match — a component added to one size and not the other would
   silently lose its scale. */
const SELECTOR_GROUPS = [
  {
    name: "size-scale-participants",
    file: "src/css/core/variants.css",
    rules: [".sm", ".lg"],
  },
];

function participantList(source, sizeClass) {
  // The participant list holds plain selectors (no parens), so [^()]* cannot
  // spill from one :where() into the next rule's declarations.
  const re = new RegExp(`:where\\(([^()]*)\\)\\s*\\${sizeClass}\\s*\\{`, "g");
  const found = [];
  let match = re.exec(source);
  while (match) {
    found.push(
      match[1]
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean),
    );
    match = re.exec(source);
  }
  return found;
}

function normalizeBlock(block) {
  return block
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(?:\.key|\.prose :where\(kbd\))\s*\{/g, ".key {")
    .replace(/--(?:ui|alert-default|badge-default)-(bg|border|fg)\s*:/g, "--soft-$1:")
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

  let selectorFailed = false;

  for (const group of SELECTOR_GROUPS) {
    const source = await readFile(join(ROOT, group.file), "utf8");
    const found = group.rules.map((rule) => ({
      rule,
      matches: participantList(source, rule),
    }));

    for (const { rule, matches } of found) {
      if (matches.length !== 1) {
        selectorFailed = true;
        console.error(
          `Sync check failed for ${group.name}: expected 1 ${rule} rule in ${group.file}, found ${matches.length}.`,
        );
      }
    }
    if (found.some(({ matches }) => matches.length !== 1)) continue;

    const [reference, ...others] = found.map(({ matches }) => [...matches[0]].sort());
    others.forEach((participants, i) => {
      const missing = reference.filter((part) => !participants.includes(part));
      const extra = participants.filter((part) => !reference.includes(part));
      if (missing.length > 0 || extra.length > 0) {
        selectorFailed = true;
        console.error(
          `Sync check failed for ${group.name}: ${group.rules[i + 1]} participants diverge from ${group.rules[0]} in ${group.file}.`,
        );
        for (const part of missing) console.error(`  Missing: ${part}`);
        for (const part of extra) console.error(`  Extra: ${part}`);
      }
    });
  }

  if (selectorFailed) {
    process.exit(1);
  }

  console.log(`Selector check passed (${SELECTOR_GROUPS.length} group).`);
}

main();
