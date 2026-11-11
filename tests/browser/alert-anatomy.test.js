/*
 * Alert anatomy: the title and body of an icon alert keep the content rhythm
 * whatever the icon height and the alert height, and the icon stays centred on
 * the first line box whatever the font, text size, line height or icon size.
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

// A one-line block's rect is the line box. Multiline content must keep that
// same first-line target instead of centring the icon on the entire message.
it("centres the icon on the first line box across fonts, sizes and multiline content", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    const result = await view.evaluate(`(() => {
      return ["system-ui", "serif", "monospace"].flatMap((font) => {
        document.body.style.fontFamily = font;
        return ["measure", "measure-small-text", "measure-tight-leading", "measure-large-icon",
          "measure-multiline", "plain", "tall", "stretched"].map((id) => {
          const alert = document.getElementById(id);
          const icon = alert.querySelector(":scope > .alert-icon").getBoundingClientRect();
          const line = alert.querySelector(":scope > div, :scope > strong");
          const box = line.getBoundingClientRect();
          const lineHeight = parseFloat(getComputedStyle(line).lineHeight);
          return { id, font, offset: icon.top + icon.height / 2 - (box.top + lineHeight / 2) };
        });
      });
    })()`);

    for (const { id, font, offset } of result) {
      expect(`${id} (${font}): ${Math.abs(offset) <= 0.5}`).toBe(`${id} (${font}): true`);
    }
  });
});

it("nudges only the icon in standard alerts and admonition titles", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    const result = await view.evaluate(`(() => {
      const rect = (el) => {
        const { top, height } = el.getBoundingClientRect();
        return { top, height, center: top + height / 2 };
      };
      return ["dismiss", "admonition"].flatMap((id) => {
        const alert = document.getElementById(id);
        const read = () => ({
          icon: rect(alert.querySelector(".alert-icon")),
          close: rect(alert.querySelector(".close")),
          text: rect(alert.querySelector(".alert-title > span, :scope > div")),
          body: rect(alert.querySelector("p")),
        });
        const base = read();
        const cases = [3, -3].map((nudge) => {
          alert.style.setProperty("--alert-icon-nudge", nudge + "px");
          return { id, nudge, base, moved: read() };
        });
        alert.style.removeProperty("--alert-icon-nudge");
        return cases;
      });
    })()`);
    for (const { nudge, base, moved } of result) {
      expect(Math.abs(base.icon.center - base.text.center)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(moved.icon.center - base.icon.center - nudge)).toBeLessThanOrEqual(0.5);
      expect(moved.close).toEqual(base.close);
      expect(moved.text).toEqual(base.text);
      expect(moved.body).toEqual(base.body);
    }
  });
});
