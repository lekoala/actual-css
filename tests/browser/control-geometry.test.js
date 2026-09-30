/*
 * Control geometry contract: text controls, buttons, addons, and spinners
 * share one block geometry per size so .join rows read as a single unit.
 * No new API — this locks the shared --control-size scale in place.
 */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  fixtureUrl,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/control-geometry.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

function measure(view, ids) {
  return view.evaluate(`(() => {
    const out = {};
    for (const id of ${JSON.stringify(ids)}) {
      const el = document.getElementById(id);
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      out[id] = { h: r.height, fs: Number.parseFloat(cs.fontSize) };
    }
    return out;
  })()`);
}

const within = (a, b, tol = 1.5) => Math.abs(a - b) <= tol;

it("default row shares one block height across input, select, addon, and buttons", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    const m = await measure(view, ["g-input", "g-select", "g-addon", "g-btn", "g-icon"]);
    for (const id of ["g-select", "g-addon", "g-btn", "g-icon"]) {
      expect(within(m[id].h, m["g-input"].h)).toBe(true);
    }
  });
});

it("sm and lg rows keep input and button heights together", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    const m = await measure(view, ["g-input-sm", "g-btn-sm", "g-input-lg", "g-btn-lg"]);
    expect(within(m["g-btn-sm"].h, m["g-input-sm"].h)).toBe(true);
    expect(within(m["g-btn-lg"].h, m["g-input-lg"].h)).toBe(true);
    // Scale actually steps: sm < default < lg.
    const d = await measure(view, ["g-input"]);
    expect(m["g-input-sm"].h).toBeLessThan(d["g-input"].h);
    expect(m["g-input-lg"].h).toBeGreaterThan(d["g-input"].h);
  });
});

it("a button matches the input height on its own, borders included", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    const m = await measure(view, [
      "s-input",
      "s-btn",
      "s-input-sm",
      "s-btn-sm",
      "s-input-lg",
      "s-btn-lg",
      "s-btn-edge",
      "s-link",
      "s-file",
    ]);
    // Exact, not within(): the bug this guards was 2px, one tolerance away.
    expect(m["s-btn"].h).toBe(m["s-input"].h);
    expect(m["s-btn-sm"].h).toBe(m["s-input-sm"].h);
    expect(m["s-btn-lg"].h).toBe(m["s-input-lg"].h);
    // A thicker block-end border (the edge theme's) is taken from the padding.
    expect(m["s-btn-edge"].h).toBe(m["s-input"].h);
    // .link has no border at all: none may be subtracted from it.
    expect(m["s-link"].h).toBe(m["s-input"].h);
    // The file selector button follows the same control scale.
    expect(m["s-file"].h).toBe(m["s-input"].h);
  });
});

it("spinner follows its context instead of imposing a size", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    // Stylesheet-applied gate: an unstyled span measures 0 and would fail
    // the 1em assertion before first paint.
    await waitForBrowser(
      view,
      `getComputedStyle(document.getElementById("g-spinner")).borderTopStyle === "solid"`,
    );
    const m = await measure(view, ["g-input", "g-btn", "g-btn-sm", "g-btn-lg"]);
    const s = await view.evaluate(`(() => {
      const sizes = {};
      for (const [key, id] of [["base", "g-spinner"], ["inBtn", null]]) {
        void key;
        void id;
      }
      // Layout boxes, not visual boxes: getBoundingClientRect() includes the
      // infinite rotation transform, so its height oscillates with the sample
      // phase (up to s√2). offsetHeight is the geometry this contract covers.
      const base = document.getElementById("g-spinner").offsetHeight;
      const inBtn = document.querySelector("#g-busy .spinner").offsetHeight;
      const inSm = document.querySelector("#g-busy-sm .spinner").offsetHeight;
      const inLg = document.querySelector("#g-busy-lg .spinner").offsetHeight;
      const fs = (el) => Number.parseFloat(getComputedStyle(el).fontSize);
      return {
        base,
        inBtn,
        inSm,
        inLg,
        baseFs: fs(document.getElementById("g-spinner")),
        btnFs: fs(document.getElementById("g-busy")),
      };
    })()`);
    // Spinner default is 1em of its context.
    expect(within(s.base, s.baseFs)).toBe(true);
    expect(within(s.inBtn, s.btnFs)).toBe(true);
    // Busy buttons keep the row height: spinner never stretches the button.
    expect(within(m["g-btn"].h, m["g-input"].h)).toBe(true);
    expect(s.inSm).toBeLessThan(s.inLg);
  });
});
