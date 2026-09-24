import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const it = (await browserAvailable()) ? test : test.skip;

it("alert + close, badge + close, and card + bleed work as modular imports", async () => {
  await withBrowserPage(fixtureUrl("tests/browser/modular-compositions.html"), async (view) => {
    const result = await view.evaluate(`(() => {
        const alert = document.querySelector("#alert");
        const badge = document.querySelector("#badge");
        const card = document.querySelector("#card");
        const header = card.querySelector(".bleed");
        const close = [...document.querySelectorAll(".close")];
        return {
          alertDisplay: getComputedStyle(alert).display,
          badgeDisplay: getComputedStyle(badge).display,
          closeSizes: close.map((el) => getComputedStyle(el).inlineSize),
          bleedWidth: Math.round(header.getBoundingClientRect().width),
          cardWidth: card.clientWidth,
        };
      })()`);
    expect(result.alertDisplay).toBe("grid");
    expect(result.badgeDisplay).toBe("inline-flex");
    expect(result.closeSizes.every((size) => Number.parseFloat(size) >= 24)).toBe(true);
    expect(result.bleedWidth).toBe(result.cardWidth);
  });
}, 60_000);
