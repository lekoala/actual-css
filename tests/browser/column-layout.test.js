/*
 * Real-browser .column-layout placement contracts, driven over Bun.WebView.
 *
 * One child rule reads --column-start and --column-span. The four placements
 * it must produce — neither, span only, start only, both — are asserted here,
 * with the two hooks set inline and from application classes.
 *
 * The auto-placement case is the one that fails if the start ever stops
 * defaulting to `auto`: a definite start line on every child removes them all
 * from column auto-placement, and an 8 + 4 pair stacks instead.
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

      /* start 9 + span 4 is columns 9-12, not 9-12 by accident of the canvas
         ending there — `mid` proves the span is honored. */
      expect((await readCase(view, "start-span")).items).toEqual([
        { startLine: 1, span: 8 },
        { startLine: 9, span: 4 },
      ]);
      expect((await readCase(view, "mid")).items).toEqual([{ startLine: 3, span: 4 }]);

      /* A start with no span runs to the canvas end. A fixed `span 12` default
         would place this at lines 9-21. */
      expect((await readCase(view, "start-only")).items).toEqual([{ startLine: 9, span: 4 }]);
      expect((await readCase(view, "centered")).items).toEqual([{ startLine: 2, span: 10 }]);
    },
    { artifactName: "column-layout-start" },
  );
});

it("one class rule recomposes a placement without leaving the hooks", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await setViewport(view, WIDE_VIEWPORT);
      expect((await readCase(view, "recomposed")).items).toEqual([
        { startLine: 1, span: 12 },
        { startLine: 1, span: 12 },
      ]);
    },
    { artifactName: "column-layout-recomposed" },
  );
});

it("a nested canvas keeps its own placement and does not pass it down", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await setViewport(view, WIDE_VIEWPORT);
      expect((await readCase(view, "nested-outer")).items).toEqual([{ startLine: 3, span: 8 }]);
      /* Without the per-child reset, both children would inherit start 3 /
         span 8 from the nested canvas they sit in. */
      expect((await readCase(view, "nested")).items).toEqual([
        { startLine: 1, span: 12 },
        { startLine: 1, span: 6 },
      ]);
    },
    { artifactName: "column-layout-nested" },
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

it("column-layout tracks are independent of --gap", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await setViewport(view, WIDE_VIEWPORT);
      const probe = await readCase(view, "gap-none");
      /* The track count never reads --gap; here 6 + 6 stays 6 + 6. */
      expect(probe.rows).toBe(1);
      expect(probe.items).toEqual([
        { startLine: 1, span: 6 },
        { startLine: 7, span: 6 },
      ]);
    },
    { artifactName: "column-layout-gap" },
  );
});
