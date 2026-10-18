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

it("attached panel framing applies only to direct children of the wrapper", async () => {
  await withBrowserPage(
    fixture,
    async (view) => {
      const panels = await view.evaluate(`(() => {
        return ["overview", "nested-panel", "standalone-panel"].map((id) => {
          const style = getComputedStyle(document.getElementById(id));
          return {
            border: style.borderInlineStartWidth,
            padding: style.paddingTop,
            background: style.backgroundColor,
            shadow: style.boxShadow,
          };
        });
      })()`);
      expect(panels[0].border).not.toBe("0px");
      expect(panels[0].padding).not.toBe("0px");
      for (const panel of panels.slice(1)) {
        expect(panel).toEqual({
          border: "0px",
          padding: "0px",
          background: "rgba(0, 0, 0, 0)",
          shadow: "none",
        });
      }
    },
    { sourceCss: true },
  );
}, 60_000);

it("attached tab border ends stay square at the panel opening", async () => {
  await withBrowserPage(
    fixture,
    async (view) => {
      await setViewport(view, { width: 1000 });
      // Exaggerate the border so a diagonal join cannot hide in antialiasing.
      await view.evaluate(`(() => {
        document.documentElement.style.setProperty("--border-width", "8px");
        document.getElementById("activity-tab").click();
        // Inspect the border itself, without the overlapping focus outline.
        document.activeElement.blur();
      })()`);
      for (const direction of ["ltr", "rtl"]) {
        await view.evaluate(`document.documentElement.dir = ${JSON.stringify(direction)}`);
        const { data } = await view.cdp("Page.captureScreenshot", { format: "png" });
        const painted = await view.evaluate(`(async () => {
        const img = new Image();
        img.src = ${JSON.stringify(`data:image/png;base64,${data}`)};
        await img.decode();
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);
        const scale = img.width / innerWidth;
        const at = (x, y) => [...ctx.getImageData(
          Math.floor(x * scale), Math.floor(y * scale), 1, 1
        ).data].join(",");
        const tab = document.getElementById("activity-tab").getBoundingClientRect();
        return {
          leftEnd: at(tab.left + 4, tab.bottom - 1),
          leftSide: at(tab.left + 4, tab.bottom - 12),
          rightEnd: at(tab.right - 4, tab.bottom - 1),
          rightSide: at(tab.right - 4, tab.bottom - 12),
          opening: at(tab.left + tab.width / 2, tab.bottom - 1),
          panel: at(tab.left + tab.width / 2, tab.bottom + 4),
        };
      })()`);
        expect(painted.leftEnd).toBe(painted.leftSide);
        expect(painted.rightEnd).toBe(painted.rightSide);
        expect(painted.opening).toBe(painted.panel);
        expect(painted.opening).not.toBe(painted.leftEnd);
      }
    },
    { sourceCss: true },
  );
}, 60_000);

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
            edge: style.borderBottomColor, side: style.borderInlineStartColor,
            opening: getComputedStyle(tab, "::after").backgroundColor,
            panelBorder: p.borderTopWidth,
            shadow: p.boxShadow,
            pageScrolls: document.documentElement.scrollWidth > innerWidth,
            stripScrolls: strip.scrollWidth > strip.clientWidth,
            hidden: document.getElementById("overview").hidden,
            nestedBorder: getComputedStyle(document.getElementById("nested-tab")).borderTopWidth,
          };
        })()`);
          expect(geometry.tabBottom).toBeCloseTo(geometry.panelTop, 1);
          expect(geometry.edge).toBe(geometry.side);
          expect(geometry.opening).toBe(geometry.panelFill);
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
