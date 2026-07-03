import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const SHORT_FILES = [
  "README.md",
  "docs/mental-model.md",
  "docs/tokens.md",
  "docs/components.md",
  "docs/forms.md",
  "docs/accessibility.md",
  "docs/why.md",
];

const FULL_FILES = [
  ...SHORT_FILES,
  "docs/layout.md",
  "docs/patterns.md",
  "docs/typography.md",
  "docs/ui.md",
  "docs/utilities.md",
  "docs/guidelines.md",
];

async function concat(files) {
  const chunks = [];

  for (const file of files) {
    const text = await readFile(join(ROOT, file), "utf8");
    chunks.push(`# ${file}\n\n${text.trim()}`);
  }

  return `${chunks.join("\n\n---\n\n")}\n`;
}

await writeFile(join(ROOT, "llms.txt"), await concat(SHORT_FILES));
await writeFile(join(ROOT, "llms-full.txt"), await concat(FULL_FILES));

console.log("Built llms.txt and llms-full.txt");
