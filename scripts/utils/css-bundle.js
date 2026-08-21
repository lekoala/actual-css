/*
 * Shared CSS bundling helpers: inline @import chains, strip comments, minify.
 * Used by build-dist.js (package artifacts) and build-themes.js (demo asset).
 */
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const IMPORT_RE = /^\s*@import\s+(?:url\(\s*)?["']([^"')]+)["']\s*\)?\s*;?\s*$/;

export async function inlineImports(file, stack = []) {
  const path = resolve(file);

  if (stack.includes(path)) {
    const chain = [...stack, path].map((item) => item.replace(/.*[/\\]/, ""));
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

export function stripComments(css) {
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

export function minifyCss(css) {
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

export function bundledCssIssues(css) {
  const issues = [];

  if (css.includes("@import")) issues.push("contains unresolved @import");
  if (css.includes("--lightningcss")) issues.push("contains --lightningcss-* variables");
  if (/color-mix\(in srgb/.test(css)) issues.push("contains color-mix(in srgb, ...)");
  if (/@media[^{]*\(\s*width\s*[<>]=/.test(css)) {
    issues.push("contains transpiled media query range syntax");
  }

  return issues;
}
