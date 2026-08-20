/*
 * Real-browser join outline-border contract, driven over Bun.WebView.
 *
 * Inside a field join, a default outline button adopts the field border
 * (--border via the --intent fallback), while an explicit intent (.danger,
 * .neutral) keeps its own outline color. The three cases guard the
 * "no intent" vs ".neutral" distinction.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

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
