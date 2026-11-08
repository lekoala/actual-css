/*
 * The docs pages put ~50 tab stops (header, sidebar) before <main>. The skip
 * link is the first stop: hidden at rest, visible on keyboard focus, and its
 * activation moves the sequential focus point into the content.
 */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  fixtureUrl,
  pressKey,
  tabUntil,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const it = (await browserAvailable()) ? test : test.skip;

it("first Tab reveals the skip link and Enter lands in the content", async () => {
  await withBrowserPage(fixtureUrl("site/components/button.html"), async (view) => {
    const restBottom = await view.evaluate(
      `document.querySelector(".docs-skip").getBoundingClientRect().bottom`,
    );
    expect(restBottom).toBeLessThanOrEqual(0);

    expect(await tabUntil(view, `document.activeElement?.matches(".docs-skip")`, { max: 1 })).toBe(
      true,
    );
    await waitForBrowser(
      view,
      `document.querySelector(".docs-skip").getBoundingClientRect().top >= 0`,
    );

    await pressKey(view, "Enter");
    await waitForBrowser(view, `location.hash === "#content"`);
    // Sequential focus restarts at the target: the next Tab stays inside main.
    await pressKey(view, "Tab");
    await waitForBrowser(view, `document.activeElement !== document.querySelector(".docs-skip")`);
    expect(
      await view.evaluate(`document.getElementById("content").contains(document.activeElement)`),
    ).toBe(true);
  });
}, 60_000);
