/*
 * .floating-field reads its control's state through :has(), so a label
 * rendered before the control (label-then-widget form themes) floats exactly
 * like the control-first markup.
 */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  clickSelector,
  fixtureUrl,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/floating-field.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

// Label offset inside its cell plus the size that marks the floated state.
const LABELS = `[...document.querySelectorAll(".floating-field")].map((cell) => {
  const label = cell.querySelector(".field-label");
  const c = cell.getBoundingClientRect();
  const l = label.getBoundingClientRect();
  return {
    case: cell.dataset.case,
    top: Math.round(l.top - c.top),
    left: Math.round(l.left - c.left),
    fontSize: getComputedStyle(label).fontSize,
  };
})`;

function pairs(labels) {
  const out = [];
  for (let i = 0; i < labels.length; i += 2) out.push([labels[i], labels[i + 1]]);
  return out;
}

it("label-first and control-first cells render every state identically", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const labels = await view.evaluate(LABELS);
      for (const [after, before] of pairs(labels)) expect(before).toEqual(after);

      // Resting and floated must differ, or the equality above proves nothing.
      const byCase = Object.fromEntries(labels.map((l) => [l.case, l]));
      expect(byCase.empty.fontSize).not.toBe(byCase.filled.fontSize);
      expect(byCase.empty.top).toBeGreaterThan(byCase.filled.top);
      expect(byCase.select.fontSize).toBe(byCase.filled.fontSize);
      expect(byCase.date.fontSize).toBe(byCase.filled.fontSize);
      expect(byCase.injected.fontSize).toBe(byCase.filled.fontSize);
      expect(byCase["textarea-filled"].fontSize).toBe(byCase.filled.fontSize);
    },
    { artifactName: "floating-field-order" },
  );
});

it("focus floats the label in both orders", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const floated = await view.evaluate(
        `getComputedStyle(document.querySelector('[data-case="filled"] .field-label')).fontSize`,
      );
      for (const id of ["focus-after", "focus-before"]) {
        await clickSelector(view, `#${id}`);
        await waitForBrowser(view, `document.activeElement?.id === ${JSON.stringify(id)}`);
        const size = await view.evaluate(
          `getComputedStyle(document.getElementById(${JSON.stringify(id)}).parentElement.querySelector(".field-label")).fontSize`,
        );
        expect(size).toBe(floated);
      }
    },
    { artifactName: "floating-field-focus" },
  );
});
