/*
 * Real-browser contract for the three presentations of one .app-nav landmark:
 * bottom bar below 48rem, labelled side navigation above, and the icon rail an
 * application selects with data-nav="rail" on .app-layout. Tiles are links and
 * buttons; a direct-child header and footer exist in the side presentations
 * only. See docs/design-notes/app-navigation-presentations.md.
 */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  fixtureUrl,
  forceStates,
  setViewport,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/app-nav-presentations.html";
const TIMEOUT = 60_000;
const NARROW = { width: 400, height: 800 };
const WIDE = { width: 1100, height: 900 };

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

const READ = `(() => {
  const box = (id) => {
    const el = document.getElementById(id);
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      x: r.x, y: r.y, w: r.width, h: r.height, bottom: r.bottom,
      display: cs.display, font: cs.fontFamily, size: cs.fontSize,
      bg: cs.backgroundColor, ink: cs.color,
    };
  };
  const nav = document.getElementById("nav");
  return {
    nav: { ...box("nav"), padEnd: parseFloat(getComputedStyle(nav).paddingBlockEnd),
      scroll: nav.scrollHeight, client: nav.clientHeight, overflow: getComputedStyle(nav).overflowY },
    header: box("nav-header"),
    brand: box("brand"),
    action: box("action"),
    topbar: box("topbar-control"),
    topbarBottom: document.querySelector(".topbar").getBoundingClientRect().bottom,
    footer: box("nav-footer"),
    current: box("current"),
    currentLabel: box("current-label"),
    link: box("link"),
    linkIcon: box("link-icon"),
    count: box("count"),
    more: box("more"),
    disabled: box("disabled"),
    rail: parseFloat(getComputedStyle(document.getElementById("layout")).getPropertyValue("--app-nav-rail-size"))
      * parseFloat(getComputedStyle(document.documentElement).fontSize),
  };
})()`;

const setRail = (view) =>
  view.evaluate('document.getElementById("layout").setAttribute("data-nav", "rail")');

it("the bottom bar shows destinations only and ignores the rail preference", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await setRail(view);
      const g = await view.evaluate(READ);
      expect(g.header.display).toBe("none");
      expect(g.footer.display).toBe("none");
      // Buttons are tiles with the links' geometry and type.
      expect(g.more.w).toBe(g.link.w);
      expect(g.more.h).toBe(g.link.h);
      expect(g.more.font).toBe(g.link.font);
      expect(g.more.size).toBe(g.link.size);
      // data-nav="rail" is a desktop preference: labels stay visible here.
      expect(g.currentLabel.w).toBeGreaterThan(1);
    },
    { ...NARROW, artifactName: "app-nav-presentations-bar" },
  );
});

it("side navigation puts the header first and the footer at the block end", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const g = await view.evaluate(READ);
      expect(g.header.display).toBe("grid");
      expect(g.header.bottom).toBeLessThanOrEqual(g.current.y);
      expect(g.footer.y).toBeGreaterThan(g.disabled.bottom);
      expect(Math.abs(g.footer.bottom + g.nav.padEnd - g.nav.bottom)).toBeLessThan(1);
      expect(g.more.w).toBe(g.link.w);
      expect(g.more.x).toBe(g.link.x);
    },
    { ...WIDE, artifactName: "app-nav-presentations-side" },
  );
});

// The nav spans both rows and cannot read the topbar's height: one shared
// band keeps the brand on the topbar's line and the first destination level
// with the main region, whatever a primary action adds below the brand.
it("the header's brand shares the topbar band, destinations start below it", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      for (const rail of [false, true]) {
        if (rail) await setRail(view);
        const g = await view.evaluate(READ);
        const centre = (b) => b.y + b.h / 2;
        expect(Math.abs(centre(g.brand) - centre(g.topbar))).toBeLessThan(1);
        expect(g.action.y).toBeGreaterThanOrEqual(g.topbarBottom);
        expect(g.current.y).toBeGreaterThan(g.topbarBottom);
      }
    },
    { ...WIDE, artifactName: "app-nav-presentations-band" },
  );
});

// An application without global actions hides the topbar on desktop: its row
// collapses, the main region starts at the top, and the band stays the nav
// header's, for the application to size against its own first row.
it("a hidden topbar collapses its row without moving the side navigation", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await view.evaluate('document.querySelector(".topbar").style.display = "none"');
      const g = await view.evaluate(READ);
      const main = await view.evaluate(
        'document.querySelector(".app-main").getBoundingClientRect().top',
      );
      expect(main).toBe(0);
      expect(g.header.y).toBe(0);
      expect(g.current.y).toBeGreaterThan(g.header.bottom - 1);
    },
    { ...WIDE, artifactName: "app-nav-presentations-no-topbar" },
  );
});

// The brand's place decides the corner: without a nav header the topbar is a
// global bar over the navigation, in the sidebar and on the rail alike.
it("without a nav header the topbar spans the navigation", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const before = await view.evaluate(READ);
      expect(before.nav.y).toBe(0);

      await view.evaluate('document.getElementById("nav-header").remove()');
      for (const rail of [false, true]) {
        if (rail) await setRail(view);
        const g = await view.evaluate(`(() => {
          const r = (s) => document.querySelector(s).getBoundingClientRect().toJSON();
          return { topbar: r(".topbar"), nav: r(".app-nav"), main: r(".app-main") };
        })()`);
        expect(g.topbar.x).toBe(g.nav.x);
        expect(g.topbar.right).toBe(g.main.right);
        expect(g.nav.y).toBe(g.topbar.bottom);
        expect(g.main.y).toBe(g.topbar.bottom);
        expect(g.main.x).toBe(g.nav.right);
        if (rail) expect(g.nav.width).toBe(before.rail);
      }
    },
    { ...WIDE, artifactName: "app-nav-presentations-global-topbar" },
  );
});

it("a short viewport scrolls the side navigation instead of overlapping it", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await setViewport(view, { width: WIDE.width, height: 240 });
      const g = await view.evaluate(READ);
      expect(g.nav.overflow).toBe("auto");
      expect(g.nav.scroll).toBeGreaterThan(g.nav.client);
      expect(g.footer.y).toBeGreaterThanOrEqual(g.disabled.bottom);
      expect(g.disabled.h).toBe(g.link.h);
    },
    { ...WIDE, artifactName: "app-nav-presentations-short" },
  );
});

it("the rail keeps icons centred and labels as accessible names only", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await setRail(view);
      const g = await view.evaluate(READ);
      expect(g.nav.w).toBe(g.rail);
      expect(Math.abs(g.linkIcon.x + g.linkIcon.w / 2 - (g.link.x + g.link.w / 2))).toBeLessThan(1);
      // Visually hidden, not removed: a hidden or display: none label would
      // drop out of the accessibility tree and leave the tile nameless.
      expect(g.currentLabel.w).toBeLessThanOrEqual(1);
      expect(g.currentLabel.display).not.toBe("none");
      // The name the accessibility tree computes, the counter included.
      await view.cdp("DOM.enable");
      await view.cdp("Accessibility.enable");
      const { root } = await view.cdp("DOM.getDocument", { depth: 0 });
      const { nodeId } = await view.cdp("DOM.querySelector", {
        nodeId: root.nodeId,
        selector: "#link",
      });
      const { nodes } = await view.cdp("Accessibility.getPartialAXTree", {
        nodeId,
        fetchRelatives: false,
      });
      expect(nodes[0].name.value.replace(/\s+/g, " ").trim()).toBe("Tasks 4");
      // The side regions stay; what they show on the rail is application CSS.
      expect(g.header.display).toBe("grid");
      expect(g.footer.display).toBe("grid");
    },
    { ...WIDE, artifactName: "app-nav-presentations-rail" },
  );
});

it("current tint hooks repaint the current tile and hover never overrides it", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await view.evaluate(`(() => {
        const nav = document.getElementById("nav");
        nav.style.setProperty("--app-nav-current-bg", "rgb(1, 2, 3)");
        nav.style.setProperty("--app-nav-current-fg", "rgb(4, 5, 6)");
      })()`);
      await forceStates(view, {
        "#current": ["hover"],
        "#more": ["hover"],
        "#disabled": ["hover"],
      });
      const g = await view.evaluate(READ);
      expect(g.current.bg).toBe("rgb(1, 2, 3)");
      expect(g.current.ink).toBe("rgb(4, 5, 6)");
      expect(g.more.bg).not.toBe("rgba(0, 0, 0, 0)");
      expect(g.disabled.bg).toBe("rgba(0, 0, 0, 0)");
    },
    { ...WIDE, artifactName: "app-nav-presentations-current" },
  );
});
