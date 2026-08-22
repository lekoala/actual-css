/*
 * Shared CSS bundling helpers: inline @import chains, strip comments, minify.
 * Used by build-dist.js (package artifacts), build-themes.js (demo asset),
 * and the public CLI.
 */
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const IMPORT_PREFIX_RE = /^\s*@import\b/;
// Two or more characters before the colon: a Windows drive letter (D:/app.css)
// is a local path, not a URL scheme.
const EXTERNAL_SPECIFIER_RE = /^(?:[a-z][a-z0-9+.-]+:|\/\/|\/)/i;
const CHARSET_RE = /^\s*@charset\s+["'][^"']*["']\s*;[^\n]*\n?/;
const RESOLVER_STUB = "__actual_css_resolve__.js";

function skipWhitespace(source, index) {
  let next = index;

  while (next < source.length && /\s/.test(source[next])) {
    next += 1;
  }

  return next;
}

function readQuoted(source, index) {
  const quote = source[index];

  if (quote !== '"' && quote !== "'") return null;

  let value = "";

  for (let cursor = index + 1; cursor < source.length; cursor += 1) {
    const char = source[cursor];

    if (char === "\\") {
      const next = source[cursor + 1];
      if (next === undefined) return null;
      value += char;
      value += next;
      cursor += 1;
      continue;
    }

    if (char === quote) {
      return { value, index: cursor + 1 };
    }

    value += char;
  }

  return null;
}

function parseImportLine(line) {
  let index = skipWhitespace(line, 0);

  if (!line.startsWith("@import", index)) return null;

  index += "@import".length;
  index = skipWhitespace(line, index);

  let parsed = null;

  if (line.startsWith("url(", index)) {
    index += 4;
    index = skipWhitespace(line, index);

    if (line[index] === '"' || line[index] === "'") {
      parsed = readQuoted(line, index);
      if (!parsed) return null;
      index = parsed.index;
    } else {
      const end = line.indexOf(")", index);
      if (end === -1) return null;
      parsed = { value: line.slice(index, end).trim(), index: end };
      index = end;
    }

    index = skipWhitespace(line, index);
    if (line[index] !== ")") return null;
    index += 1;
  } else {
    parsed = readQuoted(line, index);
    if (!parsed) return null;
    index = parsed.index;
  }

  const rest = line.slice(index);

  // A comment opened on the import line and closed further down cannot be
  // reasoned about line by line: treat the whole statement as unsupported.
  if (hasUnterminatedComment(rest)) return null;

  const trailer = stripComments(rest).replace(/;\s*$/, "").trim();

  return {
    specifier: parsed.value,
    trailer,
  };
}

function hasUnterminatedComment(text) {
  const open = text.lastIndexOf("/*");
  return open !== -1 && text.indexOf("*/", open + 2) === -1;
}

function isExternalImportSpecifier(specifier) {
  return EXTERNAL_SPECIFIER_RE.test(specifier);
}

function resolveImportTarget(file, specifier) {
  const dir = dirname(file);

  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    return resolve(dir, specifier);
  }

  // Plain CSS reads "app.css" as a relative URL, so a neighbouring file wins
  // over package resolution; everything else goes through the exports map.
  const local = resolve(dir, specifier);
  if (existsSync(local)) return local;

  try {
    const require = createRequire(pathToFileURL(resolve(dir, RESOLVER_STUB)));
    return require.resolve(specifier);
  } catch {
    throw new Error(`Cannot resolve CSS @import "${specifier}" from ${file}`);
  }
}

function preservedImportStatement(line) {
  const statement = line.trim();
  return statement.endsWith(";") ? statement : `${statement};`;
}

async function inlineFile(path, stack, preserved) {
  if (stack.includes(path)) {
    const chain = [...stack, path].map((item) => item.replace(/.*[/\\]/, ""));
    throw new Error(`Circular CSS import: ${chain.join(" -> ")}`);
  }

  const css = await readFile(path, "utf8");
  const nextStack = [...stack, path];
  const chunks = [];

  for (const line of css.split(/\r?\n/)) {
    const parsed = parseImportLine(line);

    if (!parsed) {
      if (IMPORT_PREFIX_RE.test(line)) {
        throw new Error(`Unsupported CSS @import syntax in ${path}: ${line.trim()}`);
      }
      chunks.push(line);
      continue;
    }

    if (isExternalImportSpecifier(parsed.specifier)) {
      const statement = preservedImportStatement(line);
      if (!preserved.includes(statement)) preserved.push(statement);
      continue;
    }

    if (parsed.trailer) {
      throw new Error(`Unsupported CSS @import modifiers in ${path}: ${line.trim()}`);
    }

    const target = resolveImportTarget(path, parsed.specifier);
    chunks.push(await inlineFile(target, nextStack, preserved));
  }

  return `${chunks.join("\n").trim()}\n`;
}

export async function inlineImports(file) {
  const preserved = [];
  const body = await inlineFile(resolve(file), [], preserved);

  if (preserved.length === 0) return body;

  // An @import that survives inlining must still precede every rule, so the
  // preserved statements move to the top, after @charset if the entry has one.
  const charset = body.match(CHARSET_RE);
  const head = charset ? `${charset[0].trimEnd()}\n` : "";
  const rest = (charset ? body.slice(charset[0].length) : body).replace(/^\n+/, "");

  return `${head}${preserved.join("\n")}\n\n${rest}`;
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
