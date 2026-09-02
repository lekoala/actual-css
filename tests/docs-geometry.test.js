import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/*
 * The documentation must be able to demonstrate the framework's own contracts.
 *
 * .grid-N subdivision is driven by @container thresholds, and a demo that wants
 * them puts .container-query in its own markup, inside .docs-preview. That
 * wrapper adds no padding, so the width a reader actually sees is still the
 * preview's content box — not the viewport, not the article. Before this test
 * existed the docs article was capped at 48rem,
 * which left the preview at 45.9rem at every viewport: .grid-3 was stuck at
 * one column and .grid-4 / .grid-6 at two, forever, on a page that documents
 * "6 -> 3 -> 2 -> 1". The failure was invisible to every text-based check.
 *
 * The thresholds are read from the framework source rather than hard-coded, so
 * raising a grid threshold without giving the docs room to reach it fails here
 * instead of silently degrading every grid demo.
 */

const ROOT = join(import.meta.dir, "..");
const read = (...parts) => readFileSync(join(ROOT, ...parts), "utf8");

const gridCss = read("src", "css", "layout", "grid.css");
const docsCss = read("scripts", "docs", "assets", "docs.css");
const tokensCss = read("src", "css", "core", "tokens.css");

/** Resolve a length token declared in tokens.css to rem. */
function token(name) {
  const match = tokensCss.match(new RegExp(`--${name}:\\s*([\\d.]+)(rem|px)\\s*;`));
  if (!match) throw new Error(`tokens.css does not declare --${name}`);
  return match[2] === "px" ? Number(match[1]) / 16 : Number(match[1]);
}

/** Resolve a custom property declared in docs.css to rem. */
function docsRem(name) {
  const match = docsCss.match(new RegExp(`--${name}:\\s*([\\d.]+)rem\\s*;`));
  if (!match) throw new Error(`docs.css does not declare --${name}`);
  return Number(match[1]);
}

/** The rem value of a `padding: var(--space-NN)` declaration in a docs rule. */
function docsRulePaddingRem(selector) {
  const rule = docsCss.match(new RegExp(`\\n${selector}\\s*\\{([\\s\\S]*?)\\n\\}`));
  if (!rule) throw new Error(`docs.css has no ${selector} rule`);
  const padding = rule[1].match(/padding:\s*var\(--([\w-]+)\)\s*;/);
  if (!padding) throw new Error(`${selector} does not set padding from a token`);
  return token(padding[1]);
}

/** Every @container actual-container threshold declared by the grid primitive. */
function gridThresholdsRem() {
  const values = [
    ...gridCss.matchAll(/@container actual-container \(min-width:\s*([\d.]+)(rem|px)\)/g),
  ];
  expect(values.length).toBeGreaterThan(0);
  return values.map(([, value, unit]) => (unit === "px" ? Number(value) / 16 : Number(value)));
}

describe("documentation demo geometry", () => {
  it("grants no query container to a demo preview", () => {
    /* actual-container is a contract the author declares. A preview that
       granted it would render unlike the snippet printed beside it, and one
       shared name reaches every size-aware component, not just .grid-N. An
       example needing the context establishes it in its own markup. */
    expect(docsCss).not.toMatch(/container(-name)?:\s*actual-container/);
  });

  it("lets a preview reach the widest .grid-N threshold", () => {
    const widest = Math.max(...gridThresholdsRem());
    const previewContent =
      docsRem("docs-demo-track") -
      2 * docsRulePaddingRem("\\.docs-preview") -
      2 * token("border-width");

    expect(previewContent).toBeGreaterThanOrEqual(widest);
  });

  it("keeps headroom above the widest threshold", () => {
    /* Landing exactly on the threshold is a trap: a padding or border change
       measured in fractions of a rem would drop every wide demo a state. */
    const widest = Math.max(...gridThresholdsRem());
    const previewContent =
      docsRem("docs-demo-track") -
      2 * docsRulePaddingRem("\\.docs-preview") -
      2 * token("border-width");

    expect(previewContent - widest).toBeGreaterThanOrEqual(1);
  });

  it("sizes the shell to fit its own tracks", () => {
    /* .center resolves to --center-size minus 2 x --center-pad, so the shell
       must be that much wider than the three tracks plus their column gaps or
       the demo track never reaches --docs-demo-track at any viewport. */
    const tracks =
      docsRem("docs-nav-track") + docsRem("docs-demo-track") + docsRem("docs-toc-track");
    const columnGaps = 2 * token("space-40");
    const centerPad = 2 * 1; /* --center-pad default, center.css */

    expect(docsRem("docs-shell-size")).toBeGreaterThanOrEqual(tracks + columnGaps + centerPad);
  });

  it("drives the shell tracks from the geometry properties", () => {
    /* A literal rem value here would drift from the arithmetic above. */
    const shell = docsCss.match(/grid-template-columns:\s*\n?\s*var\(--docs-nav-track\)/);
    expect(shell).not.toBeNull();
    expect(docsCss).toMatch(/minmax\(0,\s*var\(--docs-demo-track\)\)/);
    expect(docsCss).toMatch(/var\(--docs-toc-track\)/);
  });
});
