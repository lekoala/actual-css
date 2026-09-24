/*
 * Several wide nav panels as siblings — the demanding form of the runtime's
 * "one surface is open at a time" promise (docs/pages/enhancements/flyout.md).
 *
 * The documented mega menu has a single trigger, so nothing exercised what
 * happens when a second one takes over: a stale aria-expanded, focus stranded
 * in a panel that just closed, or a 42rem panel clamped against the viewport
 * edge it happens to sit near. The triggers are deliberately at the start,
 * middle and end of the bar so both edges are covered.
 *
 * None of this is visible to happy-dom: it neither lays out nor implements the
 * Popover API, so the placement and focus cases would pass vacuously there.
 */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  fixtureUrl,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/mega-menu.html";
const TIMEOUT = 60_000;
const TRIGGERS = ["t-products", "t-solutions", "t-company"];

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

const withPage = (name, run) =>
  withBrowserPage(fixtureUrl(FIXTURE), run, {
    artifactName: `mega-menu-${name}`,
    mediaFeatures: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });

async function setViewport(view, width) {
  await view.cdp("Emulation.setDeviceMetricsOverride", {
    width,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false,
  });
}

/*
 * Real pointer events, not el.click(): a synthetic click never focuses the
 * button, so focus assertions written against it describe a path no user
 * takes — it made a takeover look like it stranded focus on <body>.
 */
async function click(view, id) {
  const at = await view
    .evaluate(`(() => {
      const r = document.getElementById(${JSON.stringify(id)}).getBoundingClientRect();
      return JSON.stringify({ x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) });
    })()`)
    .then(JSON.parse);

  for (const type of ["mousePressed", "mouseReleased"]) {
    await view.cdp("Input.dispatchMouseEvent", { ...at, type, button: "left", clickCount: 1 });
  }
}

async function press(view, key, code, keyCode = 0) {
  for (const type of ["keyDown", "keyUp"]) {
    await view.cdp("Input.dispatchKeyEvent", { type, key, code, windowsVirtualKeyCode: keyCode });
  }
}

/* What every trigger says about itself, and which panel is actually open. */
function readState(view) {
  return view
    .evaluate(`(() => {
    const expanded = {};
    for (const id of ${JSON.stringify(TRIGGERS)}) {
      expanded[id] = document.getElementById(id).getAttribute("aria-expanded");
    }
    const open = [...document.querySelectorAll(".flyout")]
      .filter((el) => el.classList.contains("is-open"))
      .map((el) => el.id);
    return JSON.stringify({ expanded, open });
  })()`)
    .then(JSON.parse);
}

it("opening a second panel closes the first and leaves no stale state", async () => {
  await withPage("takeover", async (view) => {
    await setViewport(view, 1400);

    await click(view, "t-products");
    expect(await readState(view)).toEqual({
      expanded: { "t-products": "true", "t-solutions": "false", "t-company": "false" },
      open: ["p-products"],
    });

    await click(view, "t-solutions");
    expect(await readState(view)).toEqual({
      expanded: { "t-products": "false", "t-solutions": "true", "t-company": "false" },
      open: ["p-solutions"],
    });

    await click(view, "t-company");
    expect(await readState(view)).toEqual({
      expanded: { "t-products": "false", "t-solutions": "false", "t-company": "true" },
      open: ["p-company"],
    });
  });
});

it("clicking the open trigger again closes its panel", async () => {
  await withPage("toggle", async (view) => {
    await setViewport(view, 1400);

    await click(view, "t-solutions");
    await click(view, "t-solutions");
    expect(await readState(view)).toEqual({
      expanded: { "t-products": "false", "t-solutions": "false", "t-company": "false" },
      open: [],
    });

    // And it still opens on the next click rather than latching closed.
    await click(view, "t-solutions");
    expect((await readState(view)).open).toEqual(["p-solutions"]);
  });
});

it("a panel taking over from a focused one does not strand focus", async () => {
  await withPage("focus-handover", async (view) => {
    await setViewport(view, 1400);

    await click(view, "t-solutions");
    await view.evaluate(`document.getElementById("solutions-first").focus()`);
    expect(await view.evaluate("document.activeElement.id")).toBe("solutions-first");

    await click(view, "t-company");
    const landed = await view
      .evaluate(`(() => {
        const active = document.activeElement;
        return JSON.stringify({
          id: active.id,
          insideClosedPanel: document.getElementById("p-solutions").contains(active),
        });
      })()`)
      .then(JSON.parse);

    // Focus follows the control the user acted on, rather than falling back to
    // the document — the next Tab continues from the navigation bar.
    expect(landed).toEqual({ id: "t-company", insideClosedPanel: false });
  });
});

it("activating a trigger by keyboard moves focus into its panel", async () => {
  await withPage("keyboard-open", async (view) => {
    await setViewport(view, 1400);

    await view.evaluate(`document.getElementById("t-products").focus()`);
    await press(view, "Enter", "Enter", 13);

    expect((await readState(view)).open).toEqual(["p-products"]);
    expect(await view.evaluate("document.activeElement.id")).toBe("products-first");
  });
});

it("Escape closes the open panel and returns focus to its trigger", async () => {
  await withPage("escape", async (view) => {
    await setViewport(view, 1400);

    await click(view, "t-company");
    await view.evaluate(`document.getElementById("company-first").focus()`);
    await press(view, "Escape", "Escape");

    const after = await readState(view);
    expect(after.open).toEqual([]);
    expect(after.expanded["t-company"]).toBe("false");
    expect(await view.evaluate("document.activeElement.id")).toBe("t-company");
  });
});

it("a wide panel stays inside both viewport edges", async () => {
  await withPage("clamping", async (view) => {
    for (const width of [1400, 900, 700]) {
      await setViewport(view, width);
      for (const trigger of TRIGGERS) {
        await click(view, trigger);
        await waitForBrowser(
          view,
          `(() => {
            const panel = document.getElementById(${JSON.stringify(trigger.replace("t-", "p-"))});
            const box = panel.getBoundingClientRect();
            return panel.matches(":popover-open") && box.width > 0 &&
              box.left >= -1 && box.right <= document.documentElement.clientWidth + 1;
          })()`,
        );
        const box = await view
          .evaluate(`(() => {
          const panel = document.querySelector(".flyout.is-open");
          const r = panel.getBoundingClientRect();
          return JSON.stringify({
            id: panel.id,
            left: Math.round(r.left),
            right: Math.round(r.right),
            viewport: document.documentElement.clientWidth,
          });
        })()`)
          .then(JSON.parse);

        expect({ width, ...box, past: box.left < -1 || box.right > box.viewport + 1 }).toEqual({
          width,
          ...box,
          past: false,
        });
        await click(view, trigger);
      }
    }
  });
});

it("a wide panel stays an anchored popover on a phone", async () => {
  await withPage("narrow", async (view) => {
    await setViewport(view, 360);
    await click(view, "t-products");

    const shape = await view
      .evaluate(`(() => {
      const panel = document.getElementById("p-products");
      const style = getComputedStyle(panel);
      const r = panel.getBoundingClientRect();
      return JSON.stringify({
        open: panel.classList.contains("is-open"),
        tag: panel.tagName.toLowerCase(),
        // A drawer-style mutation would show up as a full-height sheet or a
        // generated backdrop; neither is part of the flyout contract.
        blockSize: Math.round(r.height),
        viewportBlock: document.documentElement.clientHeight,
        backdrops: document.querySelectorAll(".backdrop, [data-flyout-backdrop]").length,
        left: Math.round(r.left),
        right: Math.round(r.right),
        viewport: document.documentElement.clientWidth,
      });
    })()`)
      .then(JSON.parse);

    expect(shape.open).toBe(true);
    expect(shape.tag).toBe("div");
    expect(shape.backdrops).toBe(0);
    expect(shape.blockSize).toBeLessThan(shape.viewportBlock);
    expect(shape.left).toBeGreaterThanOrEqual(-1);
    expect(shape.right).toBeLessThanOrEqual(shape.viewport + 1);

    // The page itself must not gain a horizontal scrollbar from the panel.
    expect(
      await view.evaluate(`(() => {
        window.scrollTo(9999, 0);
        const x = Math.round(window.scrollX);
        window.scrollTo(0, 0);
        return x;
      })()`),
    ).toBe(0);
  });
});
