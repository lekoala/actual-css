/*
 * Nothing a component draws may make the page scroll sideways on a phone.
 *
 * The assertion is whether the viewport actually scrolls, not
 * documentElement.scrollWidth: a descendant scroll container makes that
 * property report overflow the user can never reach, which sends a reader
 * hunting for a culprit that is correctly clipped.
 *
 * Wide content is allowed — it scrolls inside its own container. Each case
 * here is one a component owns, so a failure names the component rather than
 * the page: the table wrapper, the placeholder presets, the stepper row, a
 * code block, the navbar.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/mobile-overflow.html";
const TIMEOUT = 60_000;
/* The narrow end of the phone range, and the common Android width. */
const WIDTHS = [320, 360];

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function setViewport(view, width) {
  await view.cdp("Emulation.setDeviceMetricsOverride", {
    width,
    height: 780,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await sleep(150);
}

/* How far the viewport can actually be scrolled along the inline axis. */
function readOverflow(view) {
  return view.evaluate(`(() => {
    window.scrollTo(9999, 0);
    const x = Math.round(window.scrollX);
    window.scrollTo(0, 0);
    return x;
  })()`);
}

function readBox(view, selector) {
  return view.evaluate(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    const r = el.getBoundingClientRect();
    return { left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width) };
  })()`);
}

it("no component scrolls the page sideways at phone widths", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    for (const width of WIDTHS) {
      await setViewport(view, width);
      expect({ width, overflow: await readOverflow(view) }).toEqual({ width, overflow: 0 });
    }
  });
});

it("wide content scrolls inside its own container, not the page", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    await setViewport(view, 360);
    const viewportWidth = await view.evaluate("document.documentElement.clientWidth");

    // The table is wider than the phone by design (--table-min), and the
    // wrapper is what keeps that inside the page.
    const wrap = await readBox(view, "#wrap");
    const table = await readBox(view, "#table");
    expect(wrap.right).toBeLessThanOrEqual(viewportWidth);
    expect(table.width).toBeGreaterThan(viewportWidth);

    // Same contract for the stepper and the code block: each owns its scroll.
    for (const selector of ["#steps", "#code"]) {
      const box = await readBox(view, selector);
      expect({ selector, past: box.right > viewportWidth }).toEqual({ selector, past: false });
    }
  });
});

it("placeholder presets cap their width instead of flooring their ancestors", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    await setViewport(view, 320);
    const viewportWidth = await view.evaluate("document.documentElement.clientWidth");

    // --skeleton-width on title is 18rem, well past this viewport: the card
    // must still fit, and the placeholder must shrink with it.
    const card = await readBox(view, "#skeleton-card");
    const title = await readBox(view, "#skeleton-card [data-shape='title']");
    expect(card.width).toBeLessThanOrEqual(viewportWidth);
    expect(title.width).toBeLessThan(288);

    // The disc is the one preset with an intrinsic size, and stays square.
    const avatar = await readBox(view, "#skeleton-card [data-shape='avatar']");
    expect(avatar.width).toBe(36);
  });
});
