import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const TOKENS = new Set(["tabs", "flyout", "scrollspy", "validation"]);

const DISCOVERY_CLASSES = [
  ".tabs",
  ".flyout",
  ".scrollspy",
  ".needs-validation",
  ".status-bar",
  ".btn",
  ".field",
];

// Allow-listed reads — each with its D6 reason.
const ALLOWED = new Set([
  // validation.js D6: .field ancestor is an optional presentation adapter.
  `closest(\`.${"field"}\`)`,
  `closest('.${"field"}')`,
  `closest(".field")`,
]);

function isSelectorString(line) {
  return (
    /[`'"]/.test(line) &&
    (/querySelector|querySelectorAll|closest|matches/.test(line) ||
      /^\s*[/][*]/.test(line) === false)
  );
}

function isStateWrite(line) {
  return /classList\.(add|remove|toggle|contains)/.test(line);
}

async function jsFiles(dir) {
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) continue;
    if (entry.name.endsWith(".js")) files.push(join(dir, entry.name));
  }
  return files;
}

async function cssFiles(dir) {
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await cssFiles(path)));
    } else if (entry.name.endsWith(".css")) {
      files.push(path);
    }
  }
  return files;
}

async function checkJsDiscovery() {
  const files = await jsFiles(join(ROOT, "src", "js"));
  const offenders = [];

  for (const file of files) {
    const content = await readFile(file, "utf8");
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const cls of DISCOVERY_CLASSES) {
        if (!line.includes(cls)) continue;
        if (isStateWrite(line)) continue;
        if (ALLOWED.has(line.trim())) continue;
        // Allow data-flyout-* dataset references.
        if (line.includes(`dataset.${cls.slice(1)}`) || line.includes(`dataset${cls.slice(1)}`))
          continue;
        // Allow comments and variable names referencing the class name.
        if (/^\s*[/][/*]/.test(line.trim())) continue;
        if (line.includes(`"${cls.slice(1)}"`) || line.includes(`'${cls.slice(1)}'`)) {
          if (isSelectorString(line)) {
            offenders.push(`${file}:${i + 1}: ${line.trim()}`);
          }
        }
      }
    }
  }

  return offenders;
}

async function checkCssSelectors() {
  const files = await cssFiles(join(ROOT, "src", "css"));
  const offenders = [];
  const FORBIDDEN = [/\[data-enhance\]/, /\[data-actual-surface\]/];

  for (const file of files) {
    const content = await readFile(file, "utf8");
    for (const pattern of FORBIDDEN) {
      if (pattern.test(content)) {
        offenders.push(`${file}: selects on ${pattern.source}`);
      }
    }
  }

  return offenders;
}

/*
 * Every token used in a scanned file must be defined somewhere: either a
 * built-in, or a registerEnhancement("token", …) literal in the same file.
 * registerEnhancement is public API, so a demo may own its behavior token
 * without widening the built-in list; a stray token still trips the check.
 */
function registeredTokens(source) {
  const tokens = new Set();
  const pattern = /registerEnhancement\(\s*["']([a-z][a-z0-9-]*)["']/g;
  for (let match = pattern.exec(source); match !== null; match = pattern.exec(source)) {
    tokens.add(match[1]);
  }
  return tokens;
}

function checkTokensIn(path, source, patterns, offenders) {
  const allowed = new Set([...TOKENS, ...registeredTokens(source)]);
  for (const pattern of patterns) {
    for (let match = pattern.exec(source); match !== null; match = pattern.exec(source)) {
      for (const token of match[1].split(/\s+/)) {
        if (token && !allowed.has(token)) {
          offenders.push(`${path}: unknown token "${token}"`);
        }
      }
    }
  }
}

async function checkTokens() {
  const offenders = [];
  const patterns = [/data-enhance="([^"]*)"/g];

  const dirs = [join(ROOT, "demo", "templates")];

  const tokenFiles = [join(ROOT, "README.md"), join(ROOT, "llms.txt")];

  async function scanDir(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        await scanDir(path);
      } else if (/\.(html|md)$/.test(entry.name)) {
        const content = await readFile(path, "utf8");
        checkTokensIn(path, content, patterns, offenders);
      }
    }
  }

  for (const dir of dirs) {
    await scanDir(dir);
  }

  for (const file of tokenFiles) {
    try {
      const content = await readFile(file, "utf8");
      checkTokensIn(file, content, patterns, offenders);
    } catch {
      // File may not exist — skip.
    }
  }

  return offenders;
}

async function main() {
  const results = [];

  const js = await checkJsDiscovery();
  if (js.length) {
    results.push("JS discovery through presentation class:");
    results.push(...js);
  }

  const css = await checkCssSelectors();
  if (css.length) {
    results.push("CSS selecting on data-enhance or data-actual-surface:");
    results.push(...css);
  }

  const tokens = await checkTokens();
  if (tokens.length) {
    results.push("Unknown token in demo/docs:");
    results.push(...tokens);
  }

  if (results.length) {
    console.error(results.join("\n"));
    process.exit(1);
  }

  console.log("Enhancement check passed.");
}

main();
