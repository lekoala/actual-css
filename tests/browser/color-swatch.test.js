/*
 * Real-browser .color-swatch contract, driven over Bun.WebView.
 *
 * A control-sized swatch whose selected mark (a double ring) reads on any
 * color, with the action focus ring outside it; forced colors keep the color.
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

it("a switch-sized swatch on a control-sized target, ringed when checked", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const blue = await view.evaluate(swatch("blue"));
      expect(blue.width).toBeCloseTo(blue.controlSize, 0);
      expect(blue.height).toBeCloseTo(blue.controlSize, 0);
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
      expect(small.width).toBeLessThan(blue.width);
      expect(small.width).toBeCloseTo(small.controlSize, 0);

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
