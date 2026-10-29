import { expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildCatalog, buildTokens } from "../scripts/build-catalog.js";
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

/* The docs URL comes from each file's "Docs:" header, so components documented
   outside components/ link to their real page instead of a guessed one. */
test("every component links to its published docs page", () => {
  const { homepage } = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
  for (const entry of catalog) {
    expect(entry.docs.startsWith(homepage)).toBe(true);
    const page = entry.docs.slice(homepage.length).replace(/\.html$/, ".md");
    expect(existsSync(join(ROOT, "docs", "pages", page))).toBe(true);
  }
  const docsOf = (name) => catalog.find((entry) => entry.name === name).docs;
  expect(docsOf("tab")).toBe(`${homepage}enhancements/tabs.html`);
  expect(docsOf("join")).toBe(`${homepage}forms/joined-controls.html`);
});

test("tokens.json matches the derivation and lists only public globals", async () => {
  const tokens = await buildTokens(ROOT);
  expect(tokens).toEqual(JSON.parse(readFileSync(join(ROOT, "tokens.json"), "utf8")));
  expect(tokens.global).toEqual([...new Set(tokens.global)].sort());
  // declared in core, fallback-only core hook, theme token
  expect(tokens.global).toContain("--space-40");
  expect(tokens.global).toContain("--soft-border-mix");
  expect(tokens.global).toContain("--primary");
  // Internal header entries, shared relays, component hooks
  expect(tokens.global).not.toContain("--disabled-opacity");
  expect(tokens.global).not.toContain("--hgroup-gap");
  expect(tokens.global).not.toContain("--density-space");
  expect(tokens.global.some((name) => name.startsWith("--ui-"))).toBe(false);
  expect(tokens.global).not.toContain("--card-pad");
  // Internal in core (theme.css) although a component also writes it.
  expect(tokens.global).not.toContain("--surface-link");
  // Public globals whose local value a component classifies as internal.
  expect(tokens.global).toContain("--heading");
  expect(tokens.global).toContain("--gap");
});

test("a file outside core cannot silently call a public global token internal", async () => {
  const root = mkdtempSync(join(tmpdir(), "actual-tokens-"));
  try {
    mkdirSync(join(root, "src/css/core"), { recursive: true });
    mkdirSync(join(root, "src/css/components"), { recursive: true });
    writeFileSync(join(root, "src/css/core/tokens.css"), ":root { --relay: 0; --rhythm: 1rem; }\n");
    const component = (entry) =>
      writeFileSync(
        join(root, "src/css/components/x.css"),
        `/*\n * Internal:\n * ${entry}\n */\n.x { --relay: 1; --rhythm: 2rem; }\n`,
      );

    component("--relay");
    await expect(buildTokens(root)).rejects.toThrow(/--relay/);

    component("--rhythm (local value for the shared token)");
    expect((await buildTokens(root)).global).toEqual(["--relay", "--rhythm"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

/* A pseudo-element belongs to the compound that carries it, not to the
   selector's leading class: the trait in `.nav-list .nav-link::before` takes
   the link's ::before. A classless owner is scoped by the leading class. */
test("pseudoElements name the element whose slot is taken", () => {
  const byName = (name) => catalog.find((entry) => entry.name === name).pseudoElements;
  expect(byName("navbar")).toEqual({ ".nav-link": ["::before"] });
  expect(byName("accordion")).toEqual({ ".accordion summary": ["::after"] });
  expect(byName("button")).toBeUndefined();
});
