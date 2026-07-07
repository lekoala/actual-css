import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ENTRY = join(ROOT, "src", "css", "actual.css");
const THEMES_ENTRY = join(ROOT, "src", "css", "themes", "index.css");
const DIST = join(ROOT, "dist");

const IMPORT_RE = /^\s*@import\s+(?:url\(\s*)?["']([^"')]+)["']\s*\)?\s*;?\s*$/;

async function inlineImports(file, stack = []) {
  const path = resolve(file);

  if (stack.includes(path)) {
    const chain = [...stack, path].map((item) => item.replace(`${ROOT}\\`, ""));
    throw new Error(`Circular CSS import: ${chain.join(" -> ")}`);
  }

  const css = await readFile(path, "utf8");
  const dir = dirname(path);
  const nextStack = [...stack, path];
  const chunks = [];

  for (const line of css.split(/\r?\n/)) {
    const match = line.match(IMPORT_RE);
    if (!match) {
      chunks.push(line);
      continue;
    }

    const target = resolve(dir, match[1]);
    chunks.push(await inlineImports(target, nextStack));
  }

  return `${chunks.join("\n").trim()}\n`;
}

function stripComments(css) {
  let out = "";
  let quote = "";

  for (let i = 0; i < css.length; i += 1) {
    const char = css[i];
    const next = css[i + 1];

    if (quote) {
      out += char;
      if (char === "\\") {
        out += next ?? "";
        i += 1;
      } else if (char === quote) {
        quote = "";
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      out += char;
      continue;
    }

    if (char === "/" && next === "*") {
      i += 2;
      while (i < css.length && !(css[i] === "*" && css[i + 1] === "/")) i += 1;
      i += 1;
      continue;
    }

    out += char;
  }

  return out;
}

function minifyCss(css) {
  const source = stripComments(css).trim();
  let out = "";
  let quote = "";
  let previousWasSpace = false;

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    const next = source[i + 1];

    if (quote) {
      out += char;
      if (char === "\\") {
        out += next ?? "";
        i += 1;
      } else if (char === quote) {
        quote = "";
      }
      previousWasSpace = false;
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      out += char;
      previousWasSpace = false;
      continue;
    }

    if (/\s/.test(char)) {
      if (!previousWasSpace) out += " ";
      previousWasSpace = true;
      continue;
    }

    out += char;
    previousWasSpace = false;
  }

  return `${out.trim()}\n`;
}

async function build({ entry = ENTRY, minify, naming }) {
  const css = await inlineImports(entry);
  const code = minify ? minifyCss(css) : css;
  const outPath = join(DIST, naming);
  await writeFile(outPath, code);
  return outPath;
}

async function verifyDist(distDir) {
  const distFiles = ["actual.css", "actual.min.css", "actual-themes.min.css"];
  let ok = true;

  for (const file of distFiles) {
    const path = join(distDir, file);
    if (!existsSync(path)) continue;
    const content = await readFile(path, "utf8");

    if (content.includes("@import")) {
      console.error(`FAIL ${file}: contains unresolved @import`);
      ok = false;
    }

    if (content.includes("--lightningcss")) {
      console.error(`FAIL ${file}: contains --lightningcss-* variables`);
      ok = false;
    }

    if (/color-mix\(in srgb/.test(content)) {
      console.error(`FAIL ${file}: contains color-mix(in srgb, ...)`);
      ok = false;
    }

    if (/@media[^{]*\(\s*width\s*[<>]=/.test(content)) {
      console.error(`FAIL ${file}: contains transpiled media query range syntax`);
      ok = false;
    }
  }

  if (!ok) {
    console.error("\nDist verification FAILED");
    process.exit(1);
  }
  console.log("\nDist verification passed");
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

async function main() {
  await mkdir(DIST, { recursive: true });

  for (const f of await readdir(DIST)) {
    if ((f.startsWith("actual") && f.endsWith(".css")) || f.endsWith(".css.map")) {
      await rm(join(DIST, f), { force: true });
    }
  }

  const devPath = await build({ minify: false, naming: "actual.css" });
  const minPath = await build({ minify: true, naming: "actual.min.css" });
  const themesPath = await build({
    entry: THEMES_ENTRY,
    minify: true,
    naming: "actual-themes.min.css",
  });

  const [devStat, minStat, themesStat] = await Promise.all([
    stat(devPath),
    stat(minPath),
    stat(themesPath),
  ]);
  const ratio = ((1 - minStat.size / devStat.size) * 100).toFixed(1);

  console.log(`Built ${devPath} (${formatBytes(devStat.size)})`);
  console.log(`Built ${minPath} (${formatBytes(minStat.size)}) - ${ratio}% smaller`);
  console.log(`Built ${themesPath} (${formatBytes(themesStat.size)})`);

  await verifyDist(DIST);
}

main();
