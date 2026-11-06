/*
 * --dismiss focus contract with real input: a dismissed alert must not strand
 * focus on its hidden close button. happy-dom has no focus fixup, so only a
 * browser shows where focus lands after `hidden`.
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

const it = (await browserAvailable()) ? test : test.skip;
const TIMEOUT = 60_000;

// Exercise the source without depending on a rebuilt distribution bundle.
const bundle = await Bun.build({
  entrypoints: ["src/js/dismiss.js"],
  format: "iife",
  write: false,
});
if (!bundle.success) throw new AggregateError(bundle.logs, "Dismiss test bundle failed");
const source = await bundle.outputs[0].text();

const active = "document.activeElement.id";
const hidden = (id) => `document.getElementById(${JSON.stringify(id)}).hidden`;

async function open(view) {
  await view.evaluate(`(() => { ${source} })()`);
}

it(
  "keyboard dismissal moves focus to the next alert's close button",
  async () => {
    await withBrowserPage(fixtureUrl("tests/browser/dismiss.html"), async (view) => {
      await open(view);
      expect(await tabUntil(view, `${active} === "close-first"`)).toBe(true);

      await pressKey(view, " ");
      await waitForBrowser(view, hidden("first"));

      expect(await view.evaluate(active)).toBe("close-second");
    });
  },
  TIMEOUT,
);

it(
  "skips disabled, hidden and inert controls",
  async () => {
    await withBrowserPage(fixtureUrl("tests/browser/dismiss.html"), async (view) => {
      await open(view);
      await clickSelector(view, "#close-second");
      await waitForBrowser(view, hidden("second"));

      expect(await view.evaluate(active)).toBe("next");
    });
  },
  TIMEOUT,
);

it(
  "leaves focus alone when it is outside the target",
  async () => {
    await withBrowserPage(fixtureUrl("tests/browser/dismiss.html"), async (view) => {
      await open(view);
      await clickSelector(view, "#external");
      await waitForBrowser(view, hidden("third"));

      expect(await view.evaluate(active)).toBe("external");
    });
  },
  TIMEOUT,
);

it(
  "falls back to the nearest focusable ancestor when nothing follows",
  async () => {
    await withBrowserPage(fixtureUrl("tests/browser/dismiss.html"), async (view) => {
      await open(view);
      await clickSelector(view, "#close-last");
      await waitForBrowser(view, hidden("last"));

      expect(await view.evaluate(active)).toBe("main");
    });
  },
  TIMEOUT,
);
