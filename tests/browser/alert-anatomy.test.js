/*
 * Alert anatomy: the title and body of an icon alert keep the content rhythm
 * whatever the icon height and the alert height, and the icon stays centred on
 * the first line box whatever the text size, line height or icon size.
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

// Trap: the dismiss button is taller than the line. Top-aligned, it sat 2px
// below the title centre — next to an icon centred on it, the pair read as
// misaligned — and it grew row 1, pushing the body away from the title.
it("centres the dismiss button on the first line box without growing the row", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    const result = await view.evaluate(`(() => {
      const centre = (el) => {
        const r = el.getBoundingClientRect();
        return r.top + r.height / 2;
      };
      // Same padding, same one-line title: the body starts at the same depth
      // unless row 1 grew.
      const bodyDepth = (id) => {
        const alert = document.getElementById(id);
        return Math.round(
          alert.querySelector("p").getBoundingClientRect().top - alert.getBoundingClientRect().top,
        );
      };
      return {
        // The line is a block, so its rect is the line box, not the
        // content area an inline <strong> would report.
        offsets: Object.fromEntries(
          ["dismiss", "dismiss-small-text"].map((id) => {
            const alert = document.getElementById(id);
            const line = alert.querySelector(":scope > div");
            return [id, centre(alert.querySelector(":scope > .close")) - centre(line)];
          }),
        ),
        depth: bodyDepth("dismiss"),
        plainDepth: bodyDepth("plain"),
      };
    })()`);

    for (const [id, offset] of Object.entries(result.offsets)) {
      expect(`${id}: ${Math.abs(offset) <= 1}`).toBe(`${id}: true`);
    }
    expect(result.depth).toBe(result.plainDepth);
  });
});

// The target is the line box, not the cap: the cap's position inside a line box
// is font-dependent (CI does not run Segoe UI), while the line box is pure
// geometry. A single-line block's rect is that line box.
it("centres the icon on the first line box at any text, line or icon size", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    const offsets = await view.evaluate(`(() => Object.fromEntries(
      ["measure", "measure-small-text", "measure-tight-leading", "measure-large-icon"].map((id) => {
        const alert = document.getElementById(id);
        const icon = alert.querySelector(":scope > .alert-icon").getBoundingClientRect();
        const line = alert.querySelector(":scope > div").getBoundingClientRect();
        return [id, (icon.top + icon.height / 2) - (line.top + line.height / 2)];
      }),
    ))()`);

    for (const [id, offset] of Object.entries(offsets)) {
      expect(`${id}: ${Math.abs(offset) <= 1}`).toBe(`${id}: true`);
    }
  });
});
