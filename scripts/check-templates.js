import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const TEMPLATES_DIR = join(ROOT, "demo", "templates");

function countBraces(css) {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const open = (stripped.match(/{/g) ?? []).length;
  const close = (stripped.match(/}/g) ?? []).length;
  return { open, close };
}

async function checkFile(file) {
  const source = await readFile(join(TEMPLATES_DIR, file), "utf8");
  const styleBlocks = [...source.matchAll(/<style>([\s\S]*?)<\/style>/g)];

  const issues = [];

  for (const [, block] of styleBlocks) {
    const { open, close } = countBraces(block);
    if (open !== close) {
      issues.push(`unbalanced braces in <style> (open: ${open}, close: ${close})`);
    }
  }

  return issues;
}

async function main() {
  const files = (await readdir(TEMPLATES_DIR)).filter((file) => file.endsWith(".html"));
  let failed = false;

  for (const file of files) {
    const issues = await checkFile(file);
    if (issues.length > 0) {
      failed = true;
      console.error(`${file}:`);
      for (const issue of issues) {
        console.error(`  ${issue}`);
      }
    }
  }

  if (failed) {
    console.error("Template check failed.");
    process.exit(1);
  }

  console.log(`Template check passed (${files.length} files).`);
}

main();
