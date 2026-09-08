import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { classesFromSelectors } from "./css-classes.js";

export const CSS_SOURCE_DIR = "src/css";

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
