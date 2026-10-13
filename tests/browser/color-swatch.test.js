/*
 * Real-browser .color-swatch contract, driven over Bun.WebView.
 *
 * A swatch whose selected mark (a double ring) reads on any color, with the
 * action focus ring outside it; forced colors keep the color. Its hit area
 * reaches half the gap past it, so neighbours in a tight palette never overlap.
 * In a flyout it becomes a palette picker: a pointer pick closes the panel,
 * while arrow keys move through the colors without closing it, and the panel
 * opens on the checked color. The runtime is built from source, so these
 * assertions do not depend on a rebuilt dist bundle.
 */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  clickSelector,
  fixtureUrl,
  pressKey,
  tabUntil,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/color-swatch.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

const bundle = await Bun.build({ entrypoints: ["src/js/full.js"], format: "iife", write: false });
if (!bundle.success) throw new AggregateError(bundle.logs, "Runtime test bundle failed");
const runtime = await bundle.outputs[0].text();

const ARROW_RIGHT = { code: "ArrowRight", windowsVirtualKeyCode: 39 };

const swatch = (id) => `(() => {
  const el = document.getElementById(${JSON.stringify(id)});
  const cs = getComputedStyle(el);
  const color = getComputedStyle(el, "::before");
  const probe = document.createElement("div");
  probe.style.blockSize = "var(--control-size)";
  // Inside the swatch: .sm sets --control-size on the swatch itself.
  el.append(probe);
  const controlSize = probe.getBoundingClientRect().height;
  probe.remove();
  return {
    width: el.getBoundingClientRect().width,
    height: el.getBoundingClientRect().height,
    controlSize,
    visible: parseFloat(color.height),
    fill: color.backgroundColor,
    ring: color.boxShadow,
    adjust: color.forcedColorAdjust,
    // The focus ring belongs to the visible swatch, not the hit area.
    hostOutline: cs.outlineStyle,
    outlineStyle: color.outlineStyle,
    outlineOffset: parseFloat(color.outlineOffset),
    opacity: Number(cs.opacity),
  };
})()`;

const isOpen = `document.getElementById("accent-palette").matches(":popover-open")`;

it("a switch-sized swatch on a larger target, ringed when checked", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const blue = await view.evaluate(swatch("blue"));
      // The target reaches half the default gap past the swatch on each side.
      const gap = await view.evaluate(
        `parseFloat(getComputedStyle(document.getElementById("palette-static")).columnGap)`,
      );
      expect(blue.width).toBeCloseTo(Math.min(blue.controlSize, blue.visible + gap), 0);
      expect(blue.height).toBeCloseTo(blue.width, 0);
      // A swatch and a switch side by side are the same height.
      const switchHeight = await view.evaluate(
        `document.getElementById("switch").getBoundingClientRect().height`,
      );
      expect((await view.evaluate(swatch("beside-switch"))).visible).toBeCloseTo(switchHeight, 0);
      expect(blue.visible).toBeLessThan(blue.controlSize);
      // The hit area overflows instead of spacing: the visible gap between two
      // swatches is the layout gap, not the gap plus invisible padding.
      const spacing = await view.evaluate(`(() => {
        const dot = (id) => {
          const el = document.getElementById(id);
          const r = el.getBoundingClientRect();
          const size = parseFloat(getComputedStyle(el, "::before").width);
          return { left: r.left + (r.width - size) / 2, right: r.right - (r.width - size) / 2 };
        };
        return {
          visible: dot("white").left - dot("blue").right,
          gap: parseFloat(getComputedStyle(document.getElementById("palette-static")).columnGap),
        };
      })()`);
      expect(spacing.visible).toBeCloseTo(spacing.gap, 0);
      expect(blue.fill).toBe("rgb(37, 99, 235)");
      // Two rings: one for light colors, one for dark ones.
      expect(blue.ring.match(/inset/g)?.length).toBe(2);
      expect((await view.evaluate(swatch("white"))).ring).toBe("none");

      const small = await view.evaluate(swatch("small"));
      expect(small.visible).toBeLessThan(blue.visible);
      expect(small.width).toBeLessThanOrEqual(small.controlSize + 0.5);

      // The radio is still the control: it submits, and a disabled one dims.
      await view.evaluate(`document.getElementById("navy").click()`);
      expect((await view.evaluate(swatch("navy"))).ring).not.toBe("none");
      expect(
        await view.evaluate(`new FormData(document.getElementById("form")).get("category")`),
      ).toBe("#0b1a3a");
      expect((await view.evaluate(swatch("gray"))).opacity).toBeLessThan(1);
    },
    { artifactName: "color-swatch" },
  );
});

it("a tight palette splits the gap: each swatch owns its own center", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const ids = ["t-1", "t-2", "t-3", "t-4", "t-5"];
      const layout = await view.evaluate(`(() => {
        const ids = ${JSON.stringify(ids)};
        return ids.map((id) => {
          const el = document.getElementById(id);
          const r = el.getBoundingClientRect();
          const size = parseFloat(getComputedStyle(el, "::before").width);
          const x = r.left + r.width / 2;
          const y = r.top + r.height / 2;
          return {
            hit: { left: r.left, right: r.right, top: r.top, bottom: r.bottom },
            dot: { left: x - size / 2, top: y - size / 2, size },
            // The label a pointer lands on at this swatch's center.
            atCenter: document.elementFromPoint(x, y)?.closest(".color-swatch")?.id,
          };
        });
      })()`);
      const [t1, t2, , t4] = layout;
      for (const [i, item] of layout.entries()) expect(item.atCenter).toBe(ids[i]);
      // Neighbours meet in the gap instead of overlapping.
      expect(t1.hit.right).toBeLessThanOrEqual(t2.hit.left + 0.5);
      expect(t1.hit.bottom).toBeLessThanOrEqual(t4.hit.top + 0.5);
      // Rows sit one gap apart, like columns.
      const column = t2.dot.left - t1.dot.left - t1.dot.size;
      const row = t4.dot.top - t1.dot.top - t1.dot.size;
      expect(column).toBeCloseTo(4, 0);
      expect(row).toBeCloseTo(column, 0);
    },
    { artifactName: "color-swatch-tight" },
  );
});

it("keyboard focus draws the action ring outside the selection ring", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      expect(await tabUntil(view, `document.activeElement?.closest("#blue")`)).toBe(true);
      const ring = await view.evaluate(swatch("blue"));
      expect(ring.outlineStyle).toBe("solid");
      expect(ring.outlineOffset).toBeGreaterThan(0);
      expect(ring.hostOutline).toBe("none");
      expect((await view.evaluate(swatch("white"))).outlineStyle).toBe("none");
    },
    { artifactName: "color-swatch-focus" },
  );
});

it("forced colors keep the color and mark the selection in system colors", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const blue = await view.evaluate(swatch("blue"));
      expect(blue.adjust).toBe("none");
      expect(blue.fill).toBe("rgb(37, 99, 235)");
      expect(blue.ring.match(/inset/g)?.length).toBe(2);
      expect((await view.evaluate(swatch("white"))).fill).toBe("rgb(255, 255, 255)");
    },
    {
      artifactName: "color-swatch-forced",
      mediaFeatures: [{ name: "forced-colors", value: "active" }],
    },
  );
});

it("a palette flyout closes on a pointer pick and the trigger shows it", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await view.evaluate(`(() => { ${runtime} })()`);
      await clickSelector(view, "#trigger");
      expect(await waitForBrowser(view, isOpen)).toBe(true);

      await clickSelector(view, "#a-green");
      expect(await waitForBrowser(view, `!${isOpen}`)).toBe(true);
      expect(await view.evaluate(`document.querySelector("#a-green input").checked`)).toBe(true);
      expect(
        await view.evaluate(
          `getComputedStyle(document.getElementById("trigger"), "::before").backgroundColor`,
        ),
      ).toBe("rgb(16, 185, 129)");
      expect(await view.evaluate(`document.getElementById("accent-name").textContent`)).toBe(
        "Green",
      );
    },
    { artifactName: "color-swatch-picker-pointer" },
  );
});

it("arrow keys browse the palette without closing it; Escape returns", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await view.evaluate(`(() => { ${runtime} })()`);
      // Pick amber first, so opening has to find the checked color rather
      // than the first one.
      await view.evaluate(`document.querySelector("#a-amber input").click()`);
      expect(await tabUntil(view, `document.activeElement?.id === "trigger"`)).toBe(true);

      await pressKey(view, "Enter");
      expect(await waitForBrowser(view, isOpen)).toBe(true);
      expect(
        await waitForBrowser(
          view,
          `document.activeElement === document.querySelector("#a-amber input")`,
        ),
      ).toBe(true);
      // The panel scrolls, so it clips: its padding must hold the outside ring.
      const room = await view.evaluate(`(() => {
        const panel = document.getElementById("accent-palette");
        const swatch = document.getElementById("a-amber");
        const cs = getComputedStyle(swatch);
        const p = panel.getBoundingClientRect();
        const s = swatch.getBoundingClientRect();
        return {
          gap: Math.min(s.top - p.top, p.bottom - s.bottom, p.right - s.right) - panel.clientTop,
          ring: parseFloat(cs.outlineOffset) + parseFloat(cs.outlineWidth),
        };
      })()`);
      expect(room.gap).toBeGreaterThanOrEqual(room.ring);

      // Amber is last: the arrow wraps to blue, and the panel stays open.
      await pressKey(view, "ArrowRight", ARROW_RIGHT);
      expect(await waitForBrowser(view, `document.querySelector("#a-blue input").checked`)).toBe(
        true,
      );
      expect(await view.evaluate(isOpen)).toBe(true);

      await pressKey(view, "Escape");
      expect(await waitForBrowser(view, `!${isOpen}`)).toBe(true);
      expect(await waitForBrowser(view, `document.activeElement?.id === "trigger"`)).toBe(true);
      expect(await view.evaluate(`document.getElementById("accent-name").textContent`)).toBe(
        "Blue",
      );
    },
    { artifactName: "color-swatch-picker-keyboard" },
  );
});

const brandOpen = `document.getElementById("brand-palette").matches(":popover-open")`;
const brandForm = `[...new FormData(document.getElementById("form")).entries()]
  .filter(([k]) => k.startsWith("brand")).map(([k, v]) => k + "=" + v)`;

it("palette plus custom color: the input keeps the panel open, a swatch closes it", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await view.evaluate(`(() => { ${runtime} })()`);

      // The panel only closes outside, so opening the native dialog from the
      // custom input does not take the panel down with it.
      await clickSelector(view, "#brand-trigger");
      expect(await waitForBrowser(view, brandOpen)).toBe(true);

      // The "Custom…" text and the swatch share a center line.
      const level = await view.evaluate(`(() => {
        const row = document.getElementById("b-custom-row");
        const range = document.createRange();
        range.selectNodeContents(row.lastChild);
        const text = range.getBoundingClientRect();
        const swatch = document.getElementById("b-custom").getBoundingClientRect();
        return { text: (text.top + text.bottom) / 2, swatch: (swatch.top + swatch.bottom) / 2 };
      })()`);
      expect(Math.abs(level.text - level.swatch)).toBeLessThanOrEqual(1);

      await clickSelector(view, "#b-custom");
      expect(await view.evaluate(brandOpen)).toBe(true);

      // The dialog itself cannot be driven: commit a value the way it does.
      await view.evaluate(`(() => {
        const input = document.getElementById("b-custom");
        input.value = "#123456";
        input.dispatchEvent(new Event("change", { bubbles: true }));
      })()`);
      expect(await view.evaluate(brandForm)).toEqual(["brand-custom=#123456"]);
      expect(
        await view.evaluate(
          `getComputedStyle(document.getElementById("brand-trigger"), "::before").backgroundColor`,
        ),
      ).toBe("rgb(18, 52, 86)");
      expect(await view.evaluate(brandOpen)).toBe(true);

      // A palette swatch closes it again through data-flyout-close.
      await clickSelector(view, "#b-green");
      expect(await waitForBrowser(view, `!${brandOpen}`)).toBe(true);
      expect(await view.evaluate(brandForm)).toEqual(["brand=#10b981", "brand-custom=#123456"]);
    },
    { artifactName: "color-swatch-custom-pointer" },
  );
});

it("palette plus custom color: arrow keys still browse without closing", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await view.evaluate(`(() => { ${runtime} })()`);
      expect(await tabUntil(view, `document.activeElement?.id === "brand-trigger"`)).toBe(true);
      await pressKey(view, "Enter");
      expect(await waitForBrowser(view, brandOpen)).toBe(true);
      expect(
        await waitForBrowser(
          view,
          `document.activeElement === document.querySelector("#b-blue input")`,
        ),
      ).toBe(true);

      // data-flyout-close sits on the swatch, yet a keyboard move is not a pick.
      await pressKey(view, "ArrowRight", ARROW_RIGHT);
      expect(await waitForBrowser(view, `document.querySelector("#b-green input").checked`)).toBe(
        true,
      );
      expect(await view.evaluate(brandOpen)).toBe(true);

      // Tab reaches the custom input inside the open panel.
      await pressKey(view, "Tab");
      expect(await waitForBrowser(view, `document.activeElement?.id === "b-custom"`)).toBe(true);
      expect(await view.evaluate(brandOpen)).toBe(true);
    },
    { artifactName: "color-swatch-custom-keyboard" },
  );
});
