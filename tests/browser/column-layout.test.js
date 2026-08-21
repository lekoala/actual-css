/*
 * Real-browser .column-layout placement contracts, driven over Bun.WebView.
 *
 * The primitive is three zero-specificity tiers separated only by source
 * order, so the geometry here is the guard against a silent reorder:
 *
 *   tier 1  the child reset      auto-placed, spanning the whole canvas
 *   tier 2  .column-start-N      a definite start line, running to the end
 *   tier 3  .column-span-N       the end only, refining either of the above
 *
 * The auto-placement case is the one that fails if tier 1 ever regresses to
 * `grid-column: 1 / -1`: a definite start line on every child removes them
 * all from column auto-placement, and an 8 + 4 pair stacks instead.
 *
 * Every canvas sits in a fixed-width wrapper, so a passing test proves the
 * placement follows the twelve tracks of the canvas rather than the viewport.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/column-layout.html";
const TIMEOUT = 60_000;
const WIDE_VIEWPORT = 1900;

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

/* Geometry of one canvas, expressed in canvas units rather than pixels: a
   1200px canvas with the default gap resolves each unit to a stable width, so
   `unit` and `offset` read as column coordinates. */
async function readCase(view, name) {
  return view.evaluate(`(() => {
    const canvas = document.querySelector('[data-case="${name}"]');
    const box = canvas.getBoundingClientRect();
    const gap = parseFloat(getComputedStyle(canvas).columnGap);
    const unit = (box.width - gap * 11) / 12;
    return {
      overflows: canvas.scrollWidth > canvas.clientWidth + 1,
      rows: [...new Set([...canvas.children].map((el) => Math.round(el.getBoundingClientRect().top)))].length,
      items: [...canvas.children].map((el) => {
        const r = el.getBoundingClientRect();
        return {
          startLine: Math.round((r.left - box.left) / (unit + gap)) + 1,
          span: Math.round((r.width + gap) / (unit + gap)),
        };
      }),
    };
  })()`);
}

it("auto-placement flows peers across the canvas", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await setViewport(view, WIDE_VIEWPORT);
      const probe = await readCase(view, "auto-8-4");
      /* One row, and the aside lands on line 9 without naming it. This is the
         assertion that a `1 / -1` child reset turns into two rows. */
      expect(probe.rows).toBe(1);
      expect(probe.items).toEqual([
        { startLine: 1, span: 8 },
        { startLine: 9, span: 4 },
      ]);
      expect(probe.overflows).toBe(false);
    },
    { artifactName: "column-layout-auto" },
  );
});

it("an unplaced child spans the canvas without breaking its placed peers", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await setViewport(view, WIDE_VIEWPORT);
      const probe = await readCase(view, "mixed");
      expect(probe.items).toEqual([
        { startLine: 1, span: 12 },
        { startLine: 1, span: 4 },
        { startLine: 5, span: 4 },
        { startLine: 9, span: 4 },
      ]);
      expect(probe.rows).toBe(2);
    },
    { artifactName: "column-layout-mixed" },
  );
});

it("a span refines the end line a start leaves at the canvas edge", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await setViewport(view, WIDE_VIEWPORT);

      /* Tier 3 after tier 2: start 9 + span 4 is columns 9-12, not 9-12 by
         accident of the canvas ending there — `mid` proves the refinement. */
      expect((await readCase(view, "start-span")).items).toEqual([
        { startLine: 1, span: 8 },
        { startLine: 9, span: 4 },
      ]);
      expect((await readCase(view, "mid")).items).toEqual([{ startLine: 3, span: 4 }]);

      /* A start with no span runs to the canvas end. Setting grid-column-start
         alone would leave tier 1's `span 12` and place this at lines 9-21. */
      expect((await readCase(view, "start-only")).items).toEqual([{ startLine: 9, span: 4 }]);
      expect((await readCase(view, "centered")).items).toEqual([{ startLine: 2, span: 10 }]);
    },
    { artifactName: "column-layout-start" },
  );
});

it("regions that exceed the canvas wrap instead of overflowing", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await setViewport(view, WIDE_VIEWPORT);
      const probe = await readCase(view, "wrap");
      expect(probe.rows).toBe(2);
      expect(probe.overflows).toBe(false);
    },
    { artifactName: "column-layout-wrap" },
  );
});

it("every span in the ladder resolves to its own width", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await setViewport(view, WIDE_VIEWPORT);
      const measured = await view.evaluate(`(() => {
        return [...document.querySelectorAll("[data-span]")].map((el) => {
          const canvas = el.parentElement;
          const gap = parseFloat(getComputedStyle(canvas).columnGap);
          const unit = (canvas.getBoundingClientRect().width - gap * 11) / 12;
          return {
            declared: Number(el.dataset.span),
            measured: Math.round((el.getBoundingClientRect().width + gap) / (unit + gap)),
          };
        });
      })()`);
      expect(measured.filter((m) => m.declared !== m.measured)).toEqual([]);
      expect(measured.length).toBe(12);
    },
    { artifactName: "column-layout-ladder" },
  );
});

it("the canvas shrinks with its container instead of overflowing it", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await setViewport(view, WIDE_VIEWPORT);
      const probes = await view.evaluate(`(() => {
        return [...document.querySelectorAll("[data-narrow]")].map((canvas) => ({
          width: Number(canvas.dataset.narrow),
          canvasWidth: Math.round(canvas.getBoundingClientRect().width),
          overflows: canvas.scrollWidth > canvas.clientWidth + 1,
        }));
      })()`);
      for (const probe of probes) {
        const label = `canvas @${probe.width}`;
        /* The tracks carry no min-content floor, so the canvas matches the
           container it was given at every width, down to 280px. */
        expect(`${label}: ${probe.canvasWidth}`).toBe(`${label}: ${probe.width}`);
        expect(`${label}: overflow=${probe.overflows}`).toBe(`${label}: overflow=false`);
      }
    },
    { artifactName: "column-layout-narrow" },
  );
});

it("gap utilities are exact because the track count never reads --gap", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await setViewport(view, WIDE_VIEWPORT);
      const probe = await readCase(view, "gap-none");
      /* .gap-lg on a bare .grid-4 costs a column; here 6 + 6 stays 6 + 6. */
      expect(probe.rows).toBe(1);
      expect(probe.items).toEqual([
        { startLine: 1, span: 6 },
        { startLine: 7, span: 6 },
      ]);
    },
    { artifactName: "column-layout-gap" },
  );
});
