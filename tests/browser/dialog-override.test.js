/*
 * Dialog root specificity contract, driven over Bun.WebView.
 *
 * The modal and drawer roots are :where(dialog).modal / :where(dialog).drawer
 * (0-1-0), so a single application class outranks them by source order — no
 * dialog prefix needed on the override.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/dialog-override.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

it("a single application class overrides the dialog roots", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const result = await view.evaluate(`(() => {
        const bg = (sel) => getComputedStyle(document.querySelector(sel)).backgroundColor;
        return { modal: bg("#override-modal"), drawer: bg("#override-drawer") };
      })()`);
      expect(result.modal).toBe("rgb(1, 2, 3)");
      expect(result.drawer).toBe("rgb(4, 5, 6)");
    },
    { artifactName: "dialog-override" },
  );
});
