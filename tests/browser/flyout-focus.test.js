/*
 * Focus that lands outside an open surface closes it, and leaves focus where
 * it landed: Tab, Shift+Tab, a script. Focus inside the panel or on any of its
 * triggers keeps it open, and data-flyout-auto-close="false" opts out. Every
 * move is real keyboard or pointer input, since each assertion is about focus.
 */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  elementRect,
  fixtureUrl,
  pressKey,
  tabUntil,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const FIXTURE = fixtureUrl("tests/browser/flyout-focus.html");
const TIMEOUT = 60_000;
const SHIFT = 8;

const it = (await browserAvailable()) ? test : test.skip;

const bundle = await Bun.build({ entrypoints: ["src/js/full.js"], format: "iife", write: false });
if (!bundle.success) throw new AggregateError(bundle.logs, "Runtime test bundle failed");
const runtime = `(() => { ${await bundle.outputs[0].text()} })()`;

const open = (id) => `document.getElementById(${JSON.stringify(id)}).matches(":popover-open")`;
const focusIs = (id) => `document.activeElement?.id === ${JSON.stringify(id)}`;
const state = (view, panel) =>
  view.evaluate(`({ open: ${open(panel)}, focus: document.activeElement?.id ?? "" })`);

const withFixture = (run) =>
  withBrowserPage(
    FIXTURE,
    async (view) => {
      await view.evaluate(runtime);
      await run(view);
    },
    { width: 900, height: 1200 },
  );

it(
  "help panel: Tab and Shift+Tab close it at their destination; its trigger keeps it open",
  async () => {
    await withFixture(async (view) => {
      expect(await tabUntil(view, focusIs("help-trigger"))).toBe(true);
      await pressKey(view, "Enter");
      await waitForBrowser(view, `${open("help-panel")} && ${focusIs("help-link")}`);

      await pressKey(view, "Tab");
      await waitForBrowser(view, focusIs("help-after"));
      expect(await state(view, "help-panel")).toEqual({ open: false, focus: "help-after" });

      await pressKey(view, "Tab", { modifiers: SHIFT });
      await waitForBrowser(view, focusIs("help-trigger"));
      await pressKey(view, "Enter");
      await waitForBrowser(view, `${open("help-panel")} && ${focusIs("help-link")}`);

      // Back onto its own trigger: still open.
      await pressKey(view, "Tab", { modifiers: SHIFT });
      await waitForBrowser(view, focusIs("help-trigger"));
      expect(await state(view, "help-panel")).toEqual({ open: true, focus: "help-trigger" });

      await pressKey(view, "Tab", { modifiers: SHIFT });
      await waitForBrowser(view, focusIs("help-before"));
      expect(await state(view, "help-panel")).toEqual({ open: false, focus: "help-before" });
    });
  },
  TIMEOUT,
);

it(
  "ARIA menu: Tab leaves to the next stop without passing through the trigger; Escape returns",
  async () => {
    await withFixture(async (view) => {
      expect(await tabUntil(view, focusIs("menu-trigger"))).toBe(true);
      await pressKey(view, "Enter");
      await waitForBrowser(view, `${open("actions")} && ${focusIs("menu-first")}`);
      await pressKey(view, "ArrowDown", { windowsVirtualKeyCode: 40 });
      await waitForBrowser(view, focusIs("menu-second"));

      await pressKey(view, "Tab");
      await waitForBrowser(view, focusIs("menu-after"));
      expect(await state(view, "actions")).toEqual({ open: false, focus: "menu-after" });

      await pressKey(view, "Tab", { modifiers: SHIFT });
      await waitForBrowser(view, focusIs("menu-trigger"));
      await pressKey(view, "Enter");
      await waitForBrowser(view, `${open("actions")} && ${focusIs("menu-first")}`);
      // Shift+Tab lands on the trigger instead of skipping past it.
      await pressKey(view, "Tab", { modifiers: SHIFT });
      await waitForBrowser(view, focusIs("menu-trigger"));
      expect(await state(view, "actions")).toEqual({ open: true, focus: "menu-trigger" });
      await pressKey(view, "Escape");
      await waitForBrowser(view, `!(${open("actions")}) && ${focusIs("menu-trigger")}`);
    });
  },
  TIMEOUT,
);

it(
  "filter panel: focus moves between its fields without closing it",
  async () => {
    await withFixture(async (view) => {
      expect(await tabUntil(view, focusIs("filter-trigger"))).toBe(true);
      await pressKey(view, "Enter");
      await waitForBrowser(view, `${open("filters")} && ${focusIs("filter-a")}`);
      for (const id of ["filter-b", "filter-apply"]) {
        await pressKey(view, "Tab");
        await waitForBrowser(view, focusIs(id));
        expect(await state(view, "filters")).toEqual({ open: true, focus: id });
      }
      await pressKey(view, "Tab");
      await waitForBrowser(view, focusIs("filter-after"));
      expect(await state(view, "filters")).toEqual({ open: false, focus: "filter-after" });
    });
  },
  TIMEOUT,
);

it(
  'autoClose "false": focus leaving the panel keeps it open',
  async () => {
    await withFixture(async (view) => {
      expect(await tabUntil(view, focusIs("pinned-trigger"))).toBe(true);
      await pressKey(view, "Enter");
      await waitForBrowser(view, `${open("pinned")} && ${focusIs("pinned-link")}`);
      await pressKey(view, "Tab");
      await waitForBrowser(view, focusIs("pinned-after"));
      expect(await state(view, "pinned")).toEqual({ open: true, focus: "pinned-after" });
    });
  },
  TIMEOUT,
);

it(
  "a panel shared by two triggers stays open on either one",
  async () => {
    await withFixture(async (view) => {
      expect(await tabUntil(view, focusIs("shared-a"))).toBe(true);
      await pressKey(view, "Enter");
      await waitForBrowser(view, `${open("shared")} && ${focusIs("shared-link")}`);
      await pressKey(view, "Tab");
      await waitForBrowser(view, focusIs("shared-b"));
      expect(await state(view, "shared")).toEqual({ open: true, focus: "shared-b" });
      await pressKey(view, "Tab");
      await waitForBrowser(view, focusIs("shared-after"));
      expect(await state(view, "shared")).toEqual({ open: false, focus: "shared-after" });
    });
  },
  TIMEOUT,
);

it(
  "context menu: keyboard and pointer openings close when focus leaves",
  async () => {
    await withFixture(async (view) => {
      expect(await tabUntil(view, focusIs("row"), { max: 20 })).toBe(true);
      await pressKey(view, "ContextMenu", { windowsVirtualKeyCode: 93 });
      await waitForBrowser(view, `${open("ctx")} && ${focusIs("ctx-first")}`);
      await pressKey(view, "Tab");
      await waitForBrowser(view, focusIs("ctx-after"));
      expect(await state(view, "ctx")).toEqual({ open: false, focus: "ctx-after" });

      // A right click focuses the menu itself; Tab into its item keeps it open.
      const { x, y, width, height } = await elementRect(view, "#row");
      const at = { x: x + width / 2, y: y + height / 2, button: "right", clickCount: 1 };
      await view.cdp("Input.dispatchMouseEvent", { type: "mousePressed", ...at });
      await view.cdp("Input.dispatchMouseEvent", { type: "mouseReleased", ...at });
      await waitForBrowser(view, `${open("ctx")} && ${focusIs("ctx")}`);
      await pressKey(view, "Tab");
      await waitForBrowser(view, focusIs("ctx-first"));
      expect(await state(view, "ctx")).toEqual({ open: true, focus: "ctx-first" });
      await pressKey(view, "Tab");
      await waitForBrowser(view, focusIs("ctx-after"));
      expect(await state(view, "ctx")).toEqual({ open: false, focus: "ctx-after" });
    });
  },
  TIMEOUT,
);
