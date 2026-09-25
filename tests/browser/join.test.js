/*
 * Real-browser join outline-border contract, driven over Bun.WebView.
 *
 * Inside a field join, a default outline button adopts the field border
 * (--border via the --intent fallback), while an explicit intent (.danger,
 * .neutral) keeps its own outline color. The three cases guard the
 * "no intent" vs ".neutral" distinction.
 */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  fixtureUrl,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/join.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

it("default outline in a field join matches the field border; intents keep theirs", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const result = await view.evaluate(`(() => {
        const border = (sel) => getComputedStyle(document.querySelector(sel)).borderColor;
        return {
          input: border("#join-input"),
          default: border("#join-default"),
          danger: border("#join-danger"),
          neutral: border("#join-neutral"),
        };
      })()`);

      expect(result.default).toBe(result.input);
      expect(result.danger).not.toBe(result.input);
      expect(result.neutral).not.toBe(result.input);
    },
    { artifactName: "join" },
  );
});

it("icon-only buttons stretch to the height of labelled siblings", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const result = await view.evaluate(`(() => ({
        labelled: document.querySelector("#join-labelled").getBoundingClientRect().height,
        icon: document.querySelector("#join-icon").getBoundingClientRect().height,
      }))()`);

      expect(result.icon).toBe(result.labelled);
    },
    { artifactName: "join-icon-only" },
  );
});

it("a keyboard-focused field stacks above the adjacent field", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      for (const type of ["keyDown", "keyUp"]) {
        await view.cdp("Input.dispatchKeyEvent", {
          type,
          key: "Tab",
          code: "Tab",
          windowsVirtualKeyCode: 9,
        });
      }
      await waitForBrowser(view, `document.activeElement?.id === "join-first"`);
      const z = await view.evaluate(`(() => {
        const z = (id) => Number(getComputedStyle(document.getElementById(id)).zIndex);
        return { focused: z("join-first"), neighbour: z("join-second") };
      })()`);

      // Equal z-index lets the later sibling paint over the shared 1px edge
      // of the focused field's inset line.
      expect(z.focused).toBeGreaterThan(z.neighbour);
    },
    { artifactName: "join-focus-stack" },
  );
});

it("a wrapped field fills its stretched wrapper", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const result = await view.evaluate(`(() => {
        const h = (sel) => document.querySelector(sel).getBoundingClientRect().height;
        return { tall: h("#join-tall"), wrapper: h("#join-wrapper"), field: h("#join-wrapped") };
      })()`);

      expect(result.wrapper).toBe(result.tall);
      expect(result.field).toBe(result.wrapper);
    },
    { artifactName: "join-wrapped" },
  );
});
