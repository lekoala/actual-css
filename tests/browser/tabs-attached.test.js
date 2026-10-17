import { expect, test } from "bun:test";
import {
  browserAvailable,
  clickSelector,
  fixtureUrl,
  pressKey,
  setViewport,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const it = (await browserAvailable()) ? test : test.skip;
const fixture = fixtureUrl("tests/browser/tabs-attached.html");

for (const theme of ["light", "dark", "neo-brutalist"]) {
  it(`attached tabs share their panel edge and retain keyboard navigation in ${theme}`, async () => {
    await withBrowserPage(
      fixture,
      async (view) => {
        await view.evaluate(`document.documentElement.dataset.theme = ${JSON.stringify(theme)}`);
        for (const width of [1000, 320]) {
          await setViewport(view, { width });
          await clickSelector(view, "#overview-tab");
          await pressKey(view, "End", { code: "End", windowsVirtualKeyCode: 35 });
          await waitForBrowser(
            view,
            'document.activeElement.id === "settings-tab" && !document.getElementById("settings").hidden',
          );
          await waitForBrowser(
            view,
            `(() => {
          const tab = document.getElementById("settings-tab").getBoundingClientRect();
          const strip = document.querySelector(".tabs").getBoundingClientRect();
          return tab.left >= strip.left - 1 && tab.right <= strip.right + 1;
        })()`,
          );
          const geometry = await view.evaluate(`(() => {
          const tab = document.getElementById("settings-tab");
          const panel = document.getElementById("settings");
          const strip = document.querySelector(".tabs");
          const style = getComputedStyle(tab);
          const p = getComputedStyle(panel);
          return {
            tabBottom: tab.getBoundingClientRect().bottom,
            panelTop: panel.getBoundingClientRect().top,
            fill: style.backgroundColor, panelFill: p.backgroundColor,
            edge: style.borderBottomColor, panelBorder: p.borderTopWidth,
            shadow: p.boxShadow,
            pageScrolls: document.documentElement.scrollWidth > innerWidth,
            stripScrolls: strip.scrollWidth > strip.clientWidth,
            hidden: document.getElementById("overview").hidden,
            nestedBorder: getComputedStyle(document.getElementById("nested-tab")).borderTopWidth,
          };
        })()`);
          expect(geometry.tabBottom).toBeCloseTo(geometry.panelTop, 1);
          expect(geometry.edge).toBe(geometry.panelFill);
          expect(geometry.fill).toBe(geometry.panelFill);
          expect(geometry.panelBorder).toBe("0px");
          expect(geometry.pageScrolls).toBe(false);
          expect(geometry.stripScrolls).toBe(width === 320);
          expect(geometry.hidden).toBe(true);
          expect(geometry.nestedBorder).toBe("0px");
          expect(geometry.shadow === "none").toBe(theme !== "neo-brutalist");
          await pressKey(view, "ArrowDown", { code: "ArrowDown", windowsVirtualKeyCode: 40 });
          await waitForBrowser(view, 'document.activeElement.id === "settings"');
        }
        await view.evaluate('document.getElementById("attached").classList.add("custom")');
        expect(
          await view.evaluate('getComputedStyle(document.getElementById("settings")).paddingTop'),
        ).toBe("32px");
        expect(
          await view.evaluate(
            'getComputedStyle(document.getElementById("settings")).backgroundColor',
          ),
        ).toBe("rgb(240, 240, 255)");
        expect(
          await view.evaluate('getComputedStyle(document.getElementById("settings")).boxShadow'),
        ).toBe("none");
      },
      { sourceCss: true },
    );
  }, 60_000);
}

it("attached tabs preserve the frame and selection in forced colors", async () => {
  await withBrowserPage(
    fixture,
    async (view) => {
      await clickSelector(view, "#activity-tab");
      await waitForBrowser(view, '!document.getElementById("activity").hidden');
      const colors = await view.evaluate(`(() => {
      const active = getComputedStyle(document.getElementById("activity-tab"));
      const inactive = getComputedStyle(document.getElementById("overview-tab"));
      return { active: active.backgroundColor, inactive: inactive.backgroundColor,
        ink: active.color, frame: getComputedStyle(document.querySelector(".tabs")).borderBottomWidth };
    })()`);
      expect(colors.active).not.toBe(colors.inactive);
      expect(colors.ink).not.toBe(colors.active);
      expect(colors.frame).toBe("2px");
    },
    { sourceCss: true, mediaFeatures: [{ name: "forced-colors", value: "active" }] },
  );
}, 60_000);
