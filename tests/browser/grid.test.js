/*
 * Real-browser grid contracts, driven over Bun.WebView.
 *
 * Three separate contracts:
 *
 *   .grid           space-driven; column count follows --grid-min.
 *   .grid-N bare    bounded auto-fill baseline: responsive, overflow-safe,
 *                   never more than N columns, all items the same width.
 *   .grid-N in a    balanced subdivision: every state is a divisor of N.
 *   .container-query
 *
 * The viewport stays wide for the preset assertions; each grid sits in a
 * fixed-width wrapper, so a passing test proves the behavior follows the space
 * allocated to the grid rather than the viewport.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/grid.html";
const TIMEOUT = 60_000;
const WIDE_VIEWPORT = 1900;

/* Divisors of N, descending — the only column counts a wrapped preset may
   enter. Chosen so no state can split items unevenly (no 5 + 1, no 4 + 2). */
const DIVISOR_CHAIN = { 2: [2, 1], 3: [3, 1], 4: [4, 2, 1], 6: [6, 3, 2, 1] };

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function setViewport(view, width) {
  await view.cdp("Emulation.setDeviceMetricsOverride", {
    width,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await sleep(150);
}

async function firstRowColumns(view, width) {
  await setViewport(view, width);
  return view.evaluate(`(() => {
    const items = [...document.querySelectorAll(".grid > *")];
    const tops = items.map((el) => Math.round(el.getBoundingClientRect().top));
    const first = tops[0];
    return tops.filter((t) => t === first).length;
  })()`);
}

/* One pass over every preset probe: column count on the first row, and whether
   the items in that grid all share a width. */
async function readPresets(view) {
  return view.evaluate(`(() => {
    return [...document.querySelectorAll("[data-preset]")].map((grid) => {
      const rects = [...grid.children].map((el) => el.getBoundingClientRect());
      const top = Math.round(rects[0].top);
      return {
        preset: Number(grid.dataset.preset),
        width: Number(grid.dataset.width),
        mode: grid.dataset.mode,
        columns: rects.filter((r) => Math.round(r.top) === top).length,
        equalWidths: new Set(rects.map((r) => Math.round(r.width))).size === 1,
        overflows: grid.scrollWidth > grid.clientWidth + 1,
      };
    });
  })()`);
}

it(".grid reflows its column count with container width", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      expect(await firstRowColumns(view, 320)).toBe(1);
      expect(await firstRowColumns(view, 600)).toBe(2);
      expect(await firstRowColumns(view, 900)).toBe(3);
    },
    { artifactName: "grid" },
  );
});

it(".grid-N keeps every item the same width and never overflows", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await setViewport(view, WIDE_VIEWPORT);
      for (const probe of await readPresets(view)) {
        const label = `grid-${probe.preset} ${probe.mode} @${probe.width}`;
        expect(`${label}: equal=${probe.equalWidths}`).toBe(`${label}: equal=true`);
        expect(`${label}: overflow=${probe.overflows}`).toBe(`${label}: overflow=false`);
      }
    },
    { artifactName: "grid-equal-widths" },
  );
});

it(".grid-N bare stays bounded at N and follows its wrapper, not the viewport", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await setViewport(view, WIDE_VIEWPORT);
      const probes = (await readPresets(view)).filter((p) => p.mode === "bare");
      for (const probe of probes) {
        const label = `grid-${probe.preset} @${probe.width}`;
        expect(`${label}: ${probe.columns} <= ${probe.preset}`).toBe(
          `${label}: ${Math.min(probe.columns, probe.preset)} <= ${probe.preset}`,
        );
      }
      /* A 320px wrapper inside a 1900px viewport must still be single-column:
         this is what fails if the recipe ever drifts back to viewport rules. */
      for (const probe of probes.filter((p) => p.width === 320)) {
        expect(`grid-${probe.preset} @320: ${probe.columns}`).toBe(`grid-${probe.preset} @320: 1`);
      }
    },
    { artifactName: "grid-bounded" },
  );
});

it(".grid-N in a query container only enters divisors of N", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await setViewport(view, WIDE_VIEWPORT);
      const probes = (await readPresets(view)).filter((p) => p.mode === "cq");
      const forbidden = probes
        .filter((p) => !DIVISOR_CHAIN[p.preset].includes(p.columns))
        .map((p) => `grid-${p.preset} @${p.width} entered ${p.columns} columns`);
      expect(forbidden).toEqual([]);
      /* The chains must actually be reached, not merely never violated. */
      const reached = (preset) =>
        [...new Set(probes.filter((p) => p.preset === preset).map((p) => p.columns))].sort((a, b) => b - a);
      expect(reached(4)).toEqual([4, 2, 1]);
      expect(reached(6)).toEqual([6, 3, 2, 1]);
    },
    { artifactName: "grid-subdivision" },
  );
});
