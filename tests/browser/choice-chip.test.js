/*
 * Real-browser .choice-card.chip contract, driven over Bun.WebView.
 *
 * The chip's promise is a fixed indicator slot: the leading dot turns into the
 * check in place, so checking never moves the label or resizes the chip. The
 * native input stays the control (submission, radio exclusivity, disabled),
 * focus reaches the label through a dispatched Tab, and forced colors keep a
 * checked state distinct from the unchecked dot.
 */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  fixtureUrl,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/choice-chip.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

/* Label text box and chip box, plus the indicator layers' resolved state. */
function chipState(view, id) {
  return view.evaluate(`(() => {
    const chip = document.getElementById(${JSON.stringify(id)});
    const range = document.createRange();
    range.selectNodeContents(chip.lastChild);
    const text = range.getBoundingClientRect();
    const box = chip.getBoundingClientRect();
    const dot = getComputedStyle(chip, "::before");
    const check = getComputedStyle(chip, "::after");
    return {
      textX: text.x,
      textY: text.y,
      width: box.width,
      height: box.height,
      dotContent: dot.content,
      dotClip: dot.clipPath,
      dotBg: dot.backgroundColor,
      checkTransform: check.transform,
      checkBg: check.backgroundColor,
      opacity: getComputedStyle(chip).opacity,
    };
  })()`);
}

/* The dot's clip and the check's scale transition side by side: wait until no
   transition runs (getAnimations() flushes style, so a just-started one is
   seen), then until the check shows the expected state. */
const settled = (id, checked) =>
  `(() => {
    if (document.getAnimations().length > 0) return false;
    const t = getComputedStyle(document.getElementById(${JSON.stringify(id)}), "::after").transform;
    return ${checked} ? t === "none" || t.startsWith("matrix(1, 0, 0, 1") : t.startsWith("matrix(0, 0, 0, 0");
  })()`;

const formValues = (view) =>
  view.evaluate(
    `[...new FormData(document.getElementById("form")).entries()].map(([k, v]) => k + "=" + v)`,
  );

it("checking swaps dot for check in place and keeps the native control", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await waitForBrowser(view, settled("design", false));
      const before = await chipState(view, "design");
      expect(before.dotClip).toStartWith("circle(");
      expect(before.dotClip).not.toStartWith("circle(0px");

      await view.evaluate(`document.getElementById("design").click()`);
      await waitForBrowser(view, settled("design", true));
      const after = await chipState(view, "design");

      // Fixed slot: the label and the chip box do not move or resize.
      expect(after.textX).toBe(before.textX);
      expect(after.textY).toBe(before.textY);
      expect(after.width).toBe(before.width);
      expect(after.height).toBe(before.height);
      // The dot's clip collapses; the check has scaled in.
      expect(after.dotClip).toStartWith("circle(0px");

      // The inputs are the controls: submission and radio exclusivity.
      await view.evaluate(`document.getElementById("size-m").click()`);
      expect(await formValues(view)).toEqual(["topic=design", "size=m"]);

      // A disabled chip dims and ignores activation.
      await view.evaluate(`document.getElementById("locked").click()`);
      expect(await formValues(view)).toEqual(["topic=design", "size=m"]);
      expect(Number((await chipState(view, "locked")).opacity)).toBeLessThan(1);
    },
    { artifactName: "choice-chip" },
  );
});

it("keyboard focus on the hidden input draws the chip's outer ring", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      for (const type of ["keyDown", "keyUp"]) {
        await view.cdp("Input.dispatchKeyEvent", {
          type,
          key: "Tab",
          code: "Tab",
          windowsVirtualKeyCode: 9,
        });
      }
      await waitForBrowser(view, `document.activeElement?.id === "design-input"`);
      const ring = await view.evaluate(`(() => {
        const cs = getComputedStyle(document.getElementById("design"));
        const root = getComputedStyle(document.documentElement);
        return {
          style: cs.outlineStyle,
          width: Number.parseFloat(cs.outlineWidth),
          offset: Number.parseFloat(cs.outlineOffset),
          ringWidth: Number.parseFloat(root.getPropertyValue("--focus-ring-width")),
          ringOffset: Number.parseFloat(root.getPropertyValue("--focus-outline-offset")),
        };
      })()`);
      expect(ring.style).toBe("solid");
      expect(ring.width).toBe(ring.ringWidth);
      // An action's ring sits outside: the chip must not clip its own outline.
      expect(ring.offset).toBe(ring.ringOffset);
      expect(ring.offset).toBeGreaterThan(0);
    },
    { artifactName: "choice-chip-focus" },
  );
});

it("forced colors keep checked distinct from the unchecked dot", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await view.evaluate(`document.getElementById("design").click()`);
      await waitForBrowser(view, settled("design", true));
      const checked = await chipState(view, "design");
      const unchecked = await chipState(view, "size-m");

      // Unchecked: a visible dot. Checked: no dot layer, a check in CanvasText.
      expect(unchecked.dotContent).not.toBe("none");
      expect(unchecked.dotBg).not.toBe("rgba(0, 0, 0, 0)");
      expect(checked.dotContent).toBe("none");
      expect(checked.checkBg).toBe(unchecked.dotBg);
      expect(checked.checkTransform).not.toBe(unchecked.checkTransform);
    },
    {
      artifactName: "choice-chip-forced",
      mediaFeatures: [{ name: "forced-colors", value: "active" }],
    },
  );
});
