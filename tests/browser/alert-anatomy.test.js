/*
 * Alert anatomy: the title and body of an icon alert keep the content rhythm
 * whatever the icon height and the alert height, and the icon stays centred on
 * the first line's x-height whatever the text size, line height or icon size.
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
it("centres the dismiss button with the icon without growing the row", async () => {
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
      const ctx = document.createElement("canvas").getContext("2d");
      return {
        // The line is a block, so its rect is the line box, not the
        // content area an inline <strong> would report. The cross takes the
        // icon's optical shift, so the target is the line centre plus that
        // shift, from the line's real glyph metrics.
        offsets: Object.fromEntries(
          ["dismiss", "dismiss-small-text"].map((id) => {
            const alert = document.getElementById(id);
            const line = alert.querySelector(":scope > div");
            const style = getComputedStyle(line);
            ctx.font = style.fontWeight + " " + style.fontSize + " " + style.fontFamily;
            const shift =
              (ctx.measureText("H").actualBoundingBoxAscent -
                ctx.measureText("x").actualBoundingBoxAscent) / 2;
            return [id, centre(alert.querySelector(":scope > .close")) - centre(line) - shift];
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

// The target is the line box lowered by the optical shift onto the x-height
// centre. Both are font-agnostic in the test: the line box is geometry, and the
// expected shift comes from the real glyph metrics of whatever font CI has
// (it does not run Segoe UI). A single-line block's rect is that line box.
it("centres the icon on the first line's x-height at any text, line or icon size", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    const result = await view.evaluate(`(() => {
      const ctx = document.createElement("canvas").getContext("2d");
      return Object.fromEntries(
        ["measure", "measure-small-text", "measure-tight-leading", "measure-large-icon"].map((id) => {
          const alert = document.getElementById(id);
          const icon = alert.querySelector(":scope > .alert-icon").getBoundingClientRect();
          const line = alert.querySelector(":scope > div");
          const box = line.getBoundingClientRect();
          const style = getComputedStyle(line);
          ctx.font = style.fontWeight + " " + style.fontSize + " " + style.fontFamily;
          const shift =
            (ctx.measureText("H").actualBoundingBoxAscent -
              ctx.measureText("x").actualBoundingBoxAscent) / 2;
          return [
            id,
            { offset: icon.top + icon.height / 2 - (box.top + box.height / 2), shift },
          ];
        }),
      );
    })()`);

    for (const [id, { offset, shift }] of Object.entries(result)) {
      expect(`${id}: ${shift > 0}`).toBe(`${id}: true`);
      expect(`${id}: ${Math.abs(offset - shift) <= 1}`).toBe(`${id}: true`);
    }
  });
});
