/*
 * Current states name their aria-current value: "page" or "true" (a flyout
 * section) on .tab, "page", "location" or "true" (a section) on .nav-link, "page" or "true" (a
 * master/detail item) on .list-item.
 * Any other value — including the "false" React and Vue serialize for a false
 * binding — renders like an absent attribute.
 */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  fixtureUrl,
  tabUntil,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/aria-current.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

it("only the supported values paint the current state", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const groups = await view.evaluate(`(() => {
        const paint = (el) => {
          const own = getComputedStyle(el);
          const before = getComputedStyle(el, "::before");
          const after = getComputedStyle(el, "::after");
          return [own.color, own.backgroundColor, before.content, after.content].join(" | ");
        };
        const read = (id) => {
          const links = [...document.getElementById(id).querySelectorAll("a")];
          const none = paint(links.find((a) => a.hasAttribute("data-reference")));
          return links
            .filter((a) => a.hasAttribute("aria-current"))
            .map((a) => ({
              value: a.getAttribute("aria-current"),
              supported: a.hasAttribute("data-current"),
              painted: paint(a) !== none,
            }));
        };
        return { tabs: read("tabs"), nav: read("nav"), list: read("list") };
      })()`);

      for (const [name, items] of Object.entries(groups)) {
        for (const { value, supported, painted } of items) {
          expect(painted, `${name} aria-current="${value}"`).toBe(supported);
        }
      }
    },
    { width: 800, height: 600, artifactName: "aria-current" },
  );
});

it("the current row indicator can span the row independently of padding", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    const rows = await view.evaluate(`(() => {
      const read = (id) => {
        const row = document.getElementById(id);
        const { paddingBlockStart } = getComputedStyle(row);
        const indicator = getComputedStyle(row, "::before");
        return {
          padding: paddingBlockStart,
          start: indicator.insetBlockStart,
          end: indicator.insetBlockEnd,
          height: row.getBoundingClientRect().height,
        };
      };
      return { padded: read("padded-current"), flush: read("flush-current") };
    })()`);

    expect(parseFloat(rows.padded.padding)).toBeGreaterThan(0);
    expect(rows.padded.start).toBe(rows.padded.padding);
    expect(rows.padded.end).toBe(rows.padded.padding);
    expect(rows.flush.padding).toBe(rows.padded.padding);
    expect(rows.flush.start).toBe("0px");
    expect(rows.flush.end).toBe("0px");
    expect(rows.flush.height).toBeGreaterThan(rows.padded.height);

    expect(await tabUntil(view, "document.activeElement.id === 'flush-current'", { max: 20 })).toBe(
      true,
    );
    expect(
      await view.evaluate(`(() => {
      const focused = document.activeElement;
      return focused.matches(":focus-visible") && getComputedStyle(focused).outlineStyle === "solid"
        && getComputedStyle(focused, "::before").borderInlineStartStyle === "solid";
    })()`),
    ).toBe(true);
  });
});

it("the full-height RTL indicator follows the grouped list's end corners", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    const marks = await view.evaluate(`['first-current', 'last-current'].map((id, index) => {
      const row = document.getElementById(id);
      const indicator = getComputedStyle(row, "::before");
      const corner = index === 0 ? "borderTopRightRadius" : "borderBottomRightRadius";
      return {
        corner: indicator[corner],
        rowCorner: getComputedStyle(row)[corner],
        clip: indicator.clipPath,
        leadingBorder: indicator.borderRightStyle,
        trailingBorder: indicator.borderLeftStyle,
      };
    })`);

    for (const mark of marks) {
      expect(parseFloat(mark.rowCorner)).toBeGreaterThan(0);
      expect(mark.corner).toBe(mark.rowCorner);
      expect(mark.clip).toBe("inset(0px)");
      expect(mark.leadingBorder).toBe("solid");
      expect(mark.trailingBorder).toBe("none");
    }
  });
});
