import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

export const CSS_SOURCE_DIR = "src/css";

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

function selectorPreludes(css) {
  const preludes = [];
  let start = 0;

  for (let i = 0; i < css.length; i += 1) {
    const char = css[i];
    if (char === "{") {
      const prelude = css.slice(start, i).trim();
      if (prelude && !prelude.startsWith("@")) {
        preludes.push(prelude);
      }
      start = i + 1;
    } else if (char === "}") {
      start = i + 1;
    }
  }

  return preludes;
}

function classesFromSelectors(css) {
  const classes = new Set();

  for (const prelude of selectorPreludes(stripComments(css))) {
    for (const match of prelude.matchAll(/\.([A-Za-z_-][A-Za-z0-9_-]*)/g)) {
      classes.add(match[1]);
    }
  }

  return classes;
}

async function collectCssFiles(dir) {
  const files = [];

  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectCssFiles(path)));
    } else if (entry.name.endsWith(".css")) {
      files.push(path);
    }
  }

  return files;
}

export async function collectReservedClasses(root) {
  const files = await collectCssFiles(join(root, CSS_SOURCE_DIR));
  const classes = new Set();

  for (const file of files) {
    const css = await readFile(file, "utf8");
    for (const name of classesFromSelectors(css)) {
      classes.add(name);
    }
  }

  return [...classes].sort();
}
