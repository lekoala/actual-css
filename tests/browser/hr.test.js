/*
 * Real-browser hr contract, driven over Bun.WebView.
 *
 * The regression this guards is silent: the UA sets `margin: 0.5em auto` on
 * hr, and as a flex or grid item an inline auto margin replaces the cross-axis
 * stretch. Before base.css reset it, an <hr> inside a .stack computed to zero
 * width and simply vanished — demo/sites/admini/settings.html shipped an
 * invisible separator that way. Nothing in a screenshot review reliably
 * catches a missing hairline, so the width is asserted here instead.
 *
 * The block rhythm is the other half of the contract: --hr-space tunes the
 * element's own margin in document flow, while a layout primitive owns the
 * distance between its children and overrides it.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/hr.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

it("stretches to its container as a flex or grid item", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await view.cdp("Emulation.setDeviceMetricsOverride", {
        width: 1200,
        height: 900,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await sleep(150);

      const widths = await view.evaluate(`(() =>
        ["in-stack", "in-grid", "in-flow"].map((id) =>
          Math.round(document.querySelector("#" + id + " hr").getBoundingClientRect().width),
        ))()`);

      // 400px containers, no padding: the rule spans the full inline size in
      // every layout context. A zero here is the UA auto margin coming back.
      expect(widths).toEqual([400, 400, 400]);
    },
    { artifactName: "hr-stretch" },
  );
});

it("takes its block rhythm from --hr-space in flow, and from the parent inside a layout", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await sleep(150);

      const result = await view.evaluate(`(() => {
        const read = (id) => {
          const style = getComputedStyle(document.querySelector("#" + id + " hr"));
          return [style.marginBlockStart, style.marginBlockEnd];
        };
        return { flow: read("in-flow"), tuned: read("in-flow-tuned"), stack: read("in-stack") };
      })()`);

      // Default --space-60.
      expect(result.flow).toEqual(["32px", "32px"]);
      // The hook wins on the instance.
      expect(result.tuned).toEqual(["4px", "4px"]);
      // .stack > * { margin-block: 0 } — the parent owns sibling spacing.
      expect(result.stack).toEqual(["0px", "0px"]);
    },
    { artifactName: "hr-rhythm" },
  );
});
