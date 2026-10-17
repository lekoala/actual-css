/*
 * Alert anatomy: the title and body of an icon alert keep the content rhythm
 * whatever the icon height and the alert height.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/alert-anatomy.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

// Traps: grid-row 1 / -1 on implicit rows is the title row alone, so an icon
// taller than one line inflated it; and a stretched alert spread its extra
// height between the rows. Both pushed the body away from its title.
it("keeps the body under its title with a tall icon or a stretched alert", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    const gaps = await view.evaluate(`(() => Object.fromEntries(
      ["plain", "tall", "stretched"].map((id) => {
        const alert = document.getElementById(id);
        const title = alert.querySelector("strong").getBoundingClientRect();
        const body = alert.querySelector("p").getBoundingClientRect();
        return [id, Math.round(body.top - title.bottom)];
      }),
    ))()`);

    expect(gaps.tall).toBe(gaps.plain);
    expect(gaps.stretched).toBe(gaps.plain);
  });
});
