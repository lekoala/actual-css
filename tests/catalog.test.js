import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildCatalog } from "../scripts/build-catalog.js";
import { loadReservedClasses } from "../scripts/utils/load-reserved-classes.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const catalog = await buildCatalog(ROOT);

test("components.json matches what the generator derives from src/css and src/js", async () => {
  const committed = JSON.parse(readFileSync(join(ROOT, "components.json"), "utf8"));
  expect(catalog).toEqual(committed);
});

test("components.json is sorted by name and every name is unique", () => {
  const names = catalog.map((entry) => entry.name);
  expect(names).toEqual([...new Set(names)].sort());
});

test("every entry is a well-formed index row that only claims reserved classes", () => {
  const reserved = new Set(loadReservedClasses(join(ROOT, "reserved-classes.json")));
  for (const entry of catalog) {
    expect(typeof entry.name).toBe("string");
    expect(entry.source).toMatch(/^src\/css\/components\/.+\.css$/);
    expect(entry.cssImport).toBe(`actual-css/css/components/${entry.name}`);
    for (const name of entry.classes ?? []) {
      expect(reserved.has(name)).toBe(true);
    }
  }
});

/* Pins the intended derivation semantics, so a future parse change cannot
   quietly widen or shrink what a component claims:
   - button's modifiers (same-compound, non-shared) are owned; shared intents
     and the foreign .spinner (a descendant compound) are not.
   - tab pairs its module with the "tabs" enhancement token it registers, even
     though the token differs from the module name.
   - busy styles no class of its own (pure [aria-busy] selectors), so the key
     is absent rather than empty. */
test("button owns only its own classes and states", () => {
  const button = catalog.find((entry) => entry.name === "button");
  expect(button.classes).toEqual(["btn", "ghost", "icon-only", "link"]);
  expect(button.states).toEqual([
    "aria-busy",
    "aria-current",
    "aria-disabled",
    "aria-pressed",
    "disabled",
  ]);
});

test("tab exposes the enhancement token its module registers", () => {
  const tab = catalog.find((entry) => entry.name === "tab");
  expect(tab.jsImport).toBe("actual-css/js/tab");
  expect(tab.enhancements).toEqual(["tabs"]);
});

test("busy has no owned class", () => {
  const busy = catalog.find((entry) => entry.name === "busy");
  expect("classes" in busy).toBe(false);
});
