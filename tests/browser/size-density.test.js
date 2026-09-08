/*
 * Size roles are local opt-ins; density remains an inherited geometry context.
 * The input-icon assertions also guard against applying its em factor twice to
 * SVG dimensions.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/size-density.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

it("keeps size local and density typographically inert", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    const result = await view.evaluate(`(() => {
      const measure = (id) => {
        const element = document.getElementById(id);
        const style = getComputedStyle(element);
        return {
          font: parseFloat(style.fontSize),
          height: element.getBoundingClientRect().height,
        };
      };
      return {
        bodyFont: parseFloat(getComputedStyle(document.body).fontSize),
        plain: measure("plain-size"),
        sm: measure("control-sm"),
        def: measure("control-default"),
        lg: measure("control-lg"),
        compact: measure("density-compact"),
        densityDefault: measure("density-default"),
        spacious: measure("density-spacious"),
        localLarge: measure("local-large"),
      };
    })()`);

    expect(result.plain.font).toBe(result.bodyFont);
    expect([result.sm.font, result.def.font, result.lg.font]).toEqual([14, 16, 18]);
    expect(result.sm.height).toBeLessThan(result.def.height);
    expect(result.def.height).toBeLessThan(result.lg.height);

    expect(result.compact.font).toBe(result.densityDefault.font);
    expect(result.densityDefault.font).toBe(result.spacious.font);
    expect(result.compact.height).toBe(result.sm.height);
    expect(result.densityDefault.height).toBe(result.def.height);
    expect(result.spacious.height).toBe(result.lg.height);
    expect(result.localLarge).toEqual(result.lg);
  });
});

it("scales input icons once with their control family", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    const result = await view.evaluate(`(() => {
      const measure = (id) => {
        const wrapper = document.getElementById(id);
        const input = wrapper.querySelector("input");
        const icon = wrapper.querySelector("svg");
        return {
          wrapperFont: parseFloat(getComputedStyle(wrapper).fontSize),
          inputFont: parseFloat(getComputedStyle(input).fontSize),
          iconFont: parseFloat(getComputedStyle(icon).fontSize),
          iconWidth: icon.getBoundingClientRect().width,
        };
      };
      return [measure("icon-sm"), measure("icon-default"), measure("icon-lg")];
    })()`);

    expect(result.map(({ wrapperFont }) => wrapperFont)).toEqual([14, 16, 18]);
    expect(result.map(({ inputFont }) => inputFont)).toEqual([14, 16, 18]);
    for (const { wrapperFont, iconFont, iconWidth } of result) {
      expect(iconFont).toBe(wrapperFont * 1.25);
      expect(iconWidth).toBe(iconFont);
    }
  });
});
