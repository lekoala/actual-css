/*
 * Real-browser field focus contract, driven over Bun.WebView.
 *
 * Text fields paint an inset outline that never leaves their border box, so a
 * joined field needs no group treatment. Focus is reached with dispatched Tab
 * presses: the contract is about keyboard focus, which el.focus() fakes.
 */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  fixtureUrl,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/field-focus.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

async function tabTo(view, id) {
  for (const type of ["keyDown", "keyUp"]) {
    await view.cdp("Input.dispatchKeyEvent", {
      type,
      key: "Tab",
      code: "Tab",
      windowsVirtualKeyCode: 9,
    });
  }
  await waitForBrowser(view, `document.activeElement?.id === ${JSON.stringify(id)}`);
}

function focusStyle(view, id) {
  return view.evaluate(`(() => {
    const el = document.getElementById(${JSON.stringify(id)});
    const cs = getComputedStyle(el);
    const ring = getComputedStyle(document.documentElement).getPropertyValue("--focus-ring-width");
    return {
      width: Number.parseFloat(cs.outlineWidth),
      offset: Number.parseFloat(cs.outlineOffset),
      ringWidth: Number.parseFloat(ring),
      style: cs.outlineStyle,
      color: cs.outlineColor,
      shadow: cs.boxShadow,
      borderColor: cs.borderTopColor,
      danger: (() => {
        const probe = document.createElement("span");
        probe.style.color = "var(--danger)";
        el.parentElement.append(probe);
        const value = getComputedStyle(probe).color;
        probe.remove();
        return value;
      })(),
      joinShadow: getComputedStyle(document.getElementById("join")).boxShadow,
    };
  })()`);
}

const insideBorderBox = (s) => s.offset + s.width <= 0;

it("text fields paint an inset outline that stays inside their border box", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await tabTo(view, "plain");
      const plain = await focusStyle(view, "plain");
      expect(plain.style).toBe("solid");
      expect(plain.width).toBe(plain.ringWidth);
      expect(insideBorderBox(plain)).toBe(true);
      expect(plain.shadow).toBe("none");

      // Validation colors both the border and the focus outline.
      await tabTo(view, "invalid");
      const invalid = await focusStyle(view, "invalid");
      expect(invalid.color).toBe(invalid.danger);
      expect(invalid.borderColor).toBe(invalid.danger);

      // A joined field keeps its own indicator; the group paints nothing.
      await tabTo(view, "joined");
      const joined = await focusStyle(view, "joined");
      expect(insideBorderBox(joined)).toBe(true);
      expect(joined.joinShadow).toBe("none");

      // gradient demos the outer-halo style on purpose.
      await tabTo(view, "joined-action");
      await tabTo(view, "legacy");
      const legacy = await focusStyle(view, "legacy");
      expect(legacy.shadow).not.toBe("none");
      expect(legacy.offset).toBe(0);

      // The outline alone carries focus, so --focus must hold 3:1 against the
      // field surface in both schemes of the default theme.
      const ratios = await view.evaluate(`(() => {
        const c = document.createElement("canvas");
        c.width = c.height = 1;
        const x = c.getContext("2d", { willReadFrequently: true });
        const rgb = (value) => {
          x.clearRect(0, 0, 1, 1);
          x.fillStyle = value;
          x.fillRect(0, 0, 1, 1);
          return [...x.getImageData(0, 0, 1, 1).data.slice(0, 3)];
        };
        const lin = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
        const lum = (c) => {
          const [r, g, b] = c.map((v) => lin(v / 255));
          return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };
        const ratio = (a, b) => {
          const [p, q] = [lum(a), lum(b)].sort((m, n) => n - m);
          return (p + 0.05) / (q + 0.05);
        };
        return ["light", "dark"].map((scheme) => {
          const cs = getComputedStyle(document.querySelector("#scheme-" + scheme + " [data-focus]"));
          return ratio(rgb(cs.color), rgb(cs.backgroundColor));
        });
      })()`);
      for (const r of ratios) expect(r).toBeGreaterThanOrEqual(3);
    },
    { artifactName: "field-focus" },
  );
});

it("prefers-contrast widens the field outline and keeps it inside", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await tabTo(view, "plain");
      const plain = await focusStyle(view, "plain");
      expect(plain.width).toBe(4);
      expect(insideBorderBox(plain)).toBe(true);
    },
    {
      artifactName: "field-focus-contrast",
      mediaFeatures: [{ name: "prefers-contrast", value: "more" }],
    },
  );
});
