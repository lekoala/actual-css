/*
 * Theme catalogue — single source of truth for the named themes.
 *
 * Parses src/css/themes/index.css so the list, its order, and the per-theme
 * descriptions come from the shipped theme bundle rather than being duplicated
 * by hand in templates or the runtime. "system", "light", and "dark" are scheme
 * values handled by the runtime and are not part of the catalogue.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

export function loadThemes(root) {
  const source = readFileSync(join(root, "src", "css", "themes", "index.css"), "utf8");

  const names = [...source.matchAll(/@import\s+"\.\/([^"]+)\.css";/g)].map((match) => match[1]);

  const descriptions = new Map();
  for (const line of source.split("\n")) {
    const match = line.match(/^\s*\*\s+([\w-]+)\s+[—–-]\s+(.*)$/);
    if (match) descriptions.set(match[1], match[2].trim());
  }

  return names.map((name) => ({
    name,
    label: name.charAt(0).toUpperCase() + name.slice(1),
    description: descriptions.get(name) ?? "",
  }));
}
