/*
 * Shared CSS bundling helpers: inline @import chains, strip comments, minify.
 * Used by build-dist.js (package artifacts), build-themes.js (demo asset),
 * and the public CLI.
 */
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

const IMPORT_PREFIX_RE = /^\s*@import\b/;
// Two or more characters before the colon: a Windows drive letter (D:/app.css)
// is a local path, not a URL scheme.
const EXTERNAL_SPECIFIER_RE = /^(?:[a-z][a-z0-9+.-]+:|\/\/|\/)/i;
const CHARSET_RE = /^\s*@charset\s+["'][^"']*["']\s*;[^\n]*\n?/;
const LAYER_TRAILER_RE = /^layer(?:\(\s*([A-Za-z_-][\w-]*(?:\.[A-Za-z_-][\w-]*)*)?\s*\))?$/;
const RESOLVER_STUB = "__actual_css_resolve__.js";
// url() values that stay valid wherever the bundle lands: a scheme (data:,
// https:; two characters or more, as above), a root- or protocol-relative
// path, a bare query or fragment (same document).
const LOCATION_FREE_URL_RE = /^(?:[a-z][a-z0-9+.-]+:|\/|[?#])/i;
const IDENT_CHAR_RE = /[\w-]/;
const NODE_MODULES_SEGMENT = `${sep}node_modules${sep}`;

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

// `layer`, `layer()` and `layer(name)` are the only modifiers this bundler
// understands: dropping the @import means re-stating the layer, which an
// @layer block does exactly. Conditional modifiers stay out of scope.
function parseLayerTrailer(trailer) {
  const match = trailer.match(LAYER_TRAILER_RE);
  return match ? { name: match[1] ?? "" } : null;
}

function wrapInLayer(css, name) {
  const body = css
    .split("\n")
    .map((line) => (line.trim() === "" ? "" : `  ${line}`))
    .join("\n")
    .replace(/\n+$/, "");
  const head = name ? `@layer ${name} {` : "@layer {";

  return `${head}\n${body}\n}\n`;
}

// Index just past the string opened by the quote at `start` (escapes
// honoured), or the line end when the string is left open.
function stringEnd(line, start) {
  const quote = line[start];

  for (let i = start + 1; i < line.length; i += 1) {
    if (line[i] === "\\") i += 1;
    else if (line[i] === quote) return i + 1;
  }

  return line.length;
}

// Reads the url() whose "(" sits at `open`: { value, quote, end } with `end`
// just past ")", or null when the call does not close on this line.
function readUrlCall(line, open) {
  let i = skipWhitespace(line, open + 1);
  const quote = line[i] === '"' || line[i] === "'" ? line[i] : "";
  let value;

  if (quote) {
    // A string left open runs to the line end, so no ")" follows and the
    // check below returns null: the slice is never used then.
    const end = stringEnd(line, i);
    value = line.slice(i + 1, end - 1);
    i = skipWhitespace(line, end);
  } else {
    const start = i;
    while (i < line.length && line[i] !== ")" && !/\s/.test(line[i])) {
      i += line[i] === "\\" ? 2 : 1;
    }
    value = line.slice(start, i);
    i = skipWhitespace(line, i);
  }

  return line[i] === ")" ? { value, quote, end: i + 1 } : null;
}

// The url() value pointing at the same file as `value` written from `file`,
// seen from `base`; null when it does not depend on the stylesheet location.
function rebasedUrl(value, file, base) {
  if (value === "" || LOCATION_FREE_URL_RE.test(value)) return null;

  // Escapes would need decoding before the path means anything: refuse
  // rather than rewrite a path that is not the one the browser reads.
  if (value.includes("\\")) {
    throw new Error(
      `Escaped characters in a relative url() are not supported in ${file}: ${value}`,
    );
  }
  // A package directory is never served: the rewritten reference would only
  // ever 404. Copy such assets into the served tree and reference them there.
  if (file.includes(NODE_MODULES_SEGMENT)) {
    throw new Error(
      `Relative url() in a node_modules stylesheet cannot be served from the bundle (${file}): ${value}`,
    );
  }

  const cut = value.search(/[?#]/);
  const path = cut === -1 ? value : value.slice(0, cut);
  const suffix = cut === -1 ? "" : value.slice(cut);
  const target = resolve(dirname(file), path);
  const fromBase = relative(base, target);
  // Another Windows drive has no relative path: fail rather than emit a URL
  // the browser can never resolve.
  if (isAbsolute(fromBase)) {
    throw new Error(`Cannot reach ${target} by a relative url() from ${base} (${file})`);
  }

  const rebased = fromBase.split(sep).join("/");
  return `${rebased.startsWith(".") ? "" : "./"}${rebased}${suffix}`;
}

// Rewrites the relative url() references of one line (see rebasedUrl).
// Comments and strings are copied verbatim — a url() quoted inside a data URI
// or a `content` string is text, not a reference; `state.inComment` carries a
// comment that spans lines. A url() split over several lines is left as is.
function rebaseUrls(line, file, base, state) {
  let out = "";
  let i = 0;

  while (i < line.length) {
    if (state.inComment) {
      const close = line.indexOf("*/", i);
      const end = close === -1 ? line.length : close + 2;
      out += line.slice(i, end);
      state.inComment = close === -1;
      i = end;
      continue;
    }

    const char = line[i];

    if (char === "/" && line[i + 1] === "*") {
      state.inComment = true;
      out += "/*";
      i += 2;
      continue;
    }

    if (char === '"' || char === "'") {
      const end = stringEnd(line, i);
      out += line.slice(i, end);
      i = end;
      continue;
    }

    const call =
      line.slice(i, i + 4).toLowerCase() === "url(" && !IDENT_CHAR_RE.test(line[i - 1] ?? "")
        ? readUrlCall(line, i + 3)
        : null;
    if (!call) {
      out += char;
      i += 1;
      continue;
    }

    const rebased = rebasedUrl(call.value, file, base);

    if (rebased === null) {
      out += line.slice(i, call.end);
      i = call.end;
      continue;
    }

    // Quote whatever an unquoted url() could not hold; escape the quote kept.
    const quote = call.quote || (/[\s"'()]/.test(rebased) ? '"' : "");
    const body = quote ? rebased.replaceAll(quote, `\\${quote}`) : rebased;
    out += `url(${quote}${body}${quote})`;
    i = call.end;
  }

  return out;
}

async function inlineFile(path, stack, preserved, layered, base) {
  if (stack.includes(path)) {
    const chain = [...stack, path].map((item) => item.replace(/.*[/\\]/, ""));
    throw new Error(`Circular CSS import: ${chain.join(" -> ")}`);
  }

  const css = await readFile(path, "utf8");
  const nextStack = [...stack, path];
  const chunks = [];
  const urlState = { inComment: false };

  for (const line of css.split(/\r?\n/)) {
    const parsed = parseImportLine(line);

    if (!parsed) {
      if (IMPORT_PREFIX_RE.test(line)) {
        throw new Error(`Unsupported CSS @import syntax in ${path}: ${line.trim()}`);
      }
      chunks.push(base ? rebaseUrls(line, path, base, urlState) : line);
      continue;
    }

    if (isExternalImportSpecifier(parsed.specifier)) {
      // Hoisting is what keeps a surviving @import valid, but hoisting it out
      // of a layer would silently move its rules to another layer.
      if (layered) {
        throw new Error(
          `Remote CSS @import inside a layered import cannot be hoisted in ${path}: ${line.trim()}`,
        );
      }

      const statement = preservedImportStatement(line);
      if (!preserved.includes(statement)) preserved.push(statement);
      continue;
    }

    const layer = parsed.trailer ? parseLayerTrailer(parsed.trailer) : null;

    if (parsed.trailer && !layer) {
      throw new Error(`Unsupported CSS @import modifiers in ${path}: ${line.trim()}`);
    }

    const target = resolveImportTarget(path, parsed.specifier);
    const inlined = await inlineFile(target, nextStack, preserved, layered || layer !== null, base);
    chunks.push(layer ? wrapInLayer(inlined, layer.name) : inlined);
  }

  return `${chunks.join("\n").trim()}\n`;
}

// `outDir`: the directory the bundle will be written to. When given, relative
// url() references are rewritten to keep pointing at their files from there
// (fonts, images next to an imported stylesheet); without it they are copied
// as written, which is only right when the bundle sits beside its entry.
export async function inlineImports(file, { outDir } = {}) {
  const preserved = [];
  const base = outDir ? resolve(outDir) : null;
  const body = await inlineFile(resolve(file), [], preserved, false, base);

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

  return issues;
}
