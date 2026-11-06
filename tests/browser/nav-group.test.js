/*
 * Collapsible .nav-list groups: the nested list's labels start under the
 * parent label (1em icon + link gap), and the chevron follows native [open].
 */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  fixtureUrl,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const it = (await browserAvailable()) ? test : test.skip;
const TIMEOUT = 60_000;

const READ = `(() => {
  const left = (id) => document.getElementById(id).getBoundingClientRect().left;
  const summary = document.getElementById("summary");
  const after = getComputedStyle(summary, "::after");
  return {
    parent: left("parent-label"),
    child: left("child-label"),
    display: getComputedStyle(summary).display,
    chevron: after.content !== "none" && after.content !== "normal",
    transform: after.transform,
  };
})()`;

it(
  "a nested list aligns under the parent label and the chevron follows [open]",
  async () => {
    await withBrowserPage(fixtureUrl("tests/browser/nav-group.html"), async (view) => {
      const open = await view.evaluate(READ);
      expect(Math.abs(open.child - open.parent)).toBeLessThan(0.5);
      // Not list-item: no disclosure triangle.
      expect(open.display).toBe("inline-flex");
      expect(open.chevron).toBe(true);
      expect(open.transform).not.toBe("none");

      // The rotation transitions: wait for its end state.
      await view.evaluate(`document.getElementById("group").open = false`);
      await waitForBrowser(
        view,
        `getComputedStyle(document.getElementById("summary"), "::after").transform === "none"`,
      );
    });
  },
  TIMEOUT,
);
