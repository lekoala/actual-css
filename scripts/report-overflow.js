/*
 * Survey of horizontal overflow at phone widths: which pages let the viewport
 * scroll sideways, and what it takes to stop it.
 *
 * Analysis only — it gates nothing and exits 0 whatever it finds. The unit
 * test that owns the framework's side of this contract is
 * tests/browser/mobile-overflow.test.js; this sweeps whole pages, where the
 * cause is usually an authoring decision in the page itself.
 *
 * It asks whether the viewport can actually be scrolled, not whether
 * documentElement.scrollWidth is large: a descendant scroll container makes
 * that property report overflow no user can ever reach, which sends a reader
 * hunting for a culprit that is correctly clipped. Every overflow reported
 * here is one a reader would feel with a thumb.
 *
 * For each failing page it then bisects — hiding one subtree at a time and
 * re-asking — down to the outermost element that owns the overflow, and prints
 * the chain with each level's display, overflow-x and width. Read the last
 * entries: that is where the content stops fitting.
 *
 * Demo templates link dist/, so run a build first or the report describes the
 * previous bundle.
 *
 * Usage: bun run report:overflow [--width 360] [--pages demo|site|all]
 */
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { browserAvailable, fixtureUrl, readFlags, withBrowserPage } from "./utils/browser.js";

const args = process.argv.slice(2);
const flags = readFlags(args, {
  "--width": { fallback: "360" },
  "--pages": { fallback: "all" },
});
const width = Number(flags["--width"]);
const scope = flags["--pages"];

const DEMO_DIR = "demo/templates";
const SITE_DIRS = [
  "site",
  "site/components",
  "site/enhancements",
  "site/examples",
  "site/forms",
  "site/foundations",
  "site/guides",
  "site/layout",
  "site/patterns",
  "site/utilities",
];

function htmlIn(dir) {
  try {
    return readdirSync(dir)
      .filter((name) => name.endsWith(".html"))
      .map((name) => join(dir, name));
  } catch {
    return [];
  }
}

const pages = [];
if (scope === "demo" || scope === "all") pages.push(...htmlIn(DEMO_DIR));
if (scope === "site" || scope === "all") pages.push(...SITE_DIRS.flatMap(htmlIn));

if (!(await browserAvailable())) {
  console.error("report:overflow needs headless Chrome; none was found.");
  process.exit(0);
}

/*
 * One program, run in the page: measure, and if the viewport scrolls, walk
 * down the tree hiding one child at a time until hiding it stops the scroll.
 * Doing the bisect in-page keeps it to a single round trip per document.
 */
const PROBE = `(() => {
  const doc = document.documentElement;
  const scrollBy = () => {
    window.scrollTo(9999, 0);
    const x = Math.round(window.scrollX);
    window.scrollTo(0, 0);
    return x;
  };

  const overflow = scrollBy();
  if (!overflow) return JSON.stringify({ overflow: 0, chain: [] });

  const chain = [];
  let node = document.body;
  for (let depth = 0; depth < 14; depth++) {
    let culprit = null;
    for (const child of node.children) {
      const previous = child.style.display;
      child.style.display = "none";
      const still = scrollBy();
      child.style.display = previous;
      if (!still) {
        culprit = child;
        break;
      }
    }
    if (!culprit) break;
    const style = getComputedStyle(culprit);
    const name = culprit.tagName.toLowerCase();
    const classes = String(culprit.className || "").trim().split(/[ ]+/).filter(Boolean);
    chain.push({
      el: classes.length ? name + "." + classes.slice(0, 3).join(".") : name,
      display: style.display,
      overflowX: style.overflowX,
      position: style.position,
      width: Math.round(culprit.getBoundingClientRect().width),
    });
    node = culprit;
  }

  return JSON.stringify({ overflow, chain, viewport: doc.clientWidth });
})()`;

const failures = [];
for (const page of pages) {
  try {
    await withBrowserPage(
      fixtureUrl(page),
      async (view) => {
        await view.cdp("Emulation.setDeviceMetricsOverride", {
          width,
          height: 780,
          deviceScaleFactor: 1,
          mobile: false,
        });
        const result = JSON.parse(await view.evaluate(PROBE));
        if (result.overflow > 0) failures.push({ page, ...result });
      },
      { width, height: 780, settleMs: 500 },
    );
  } catch (error) {
    failures.push({ page, error: String(error).split("\n")[0] });
  }
}

console.log(`Horizontal overflow report — ${pages.length} pages at ${width}px`);
console.log("─".repeat(52));

if (failures.length === 0) {
  console.log("No page scrolls sideways.");
} else {
  for (const failure of failures) {
    console.log(`\n${failure.page}`);
    if (failure.error) {
      console.log(`  could not be measured: ${failure.error}`);
      continue;
    }
    console.log(`  scrolls ${failure.overflow}px past a ${failure.viewport}px viewport`);
    if (failure.chain.length === 0) {
      console.log("  no single subtree owns it — the page overflows as a whole");
    }
    for (const [index, step] of failure.chain.entries()) {
      const prefix = `  ${"  ".repeat(index)}${index === 0 ? "" : "↳ "}`;
      console.log(
        `${prefix}${step.el} [${step.display} overflow-x:${step.overflowX} ${step.width}px]`,
      );
    }
  }
  console.log(`\n${failures.length} of ${pages.length} pages scroll sideways.`);
}
