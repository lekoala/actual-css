/*
 * Real-browser .steps connector contract, driven over Bun.WebView.
 *
 * Guards the --step-connector inheritance bug: the connector background must
 * follow the step's own --step-line (resolved at use site), so a .complete
 * step's connector turns the selected color while a normal step's connector
 * keeps the border color. A fixed parent default would freeze both to the
 * border color.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/steps.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

it("a complete step's connector follows its selected line color", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const result = await view.evaluate(`(() => {
        const steps = document.querySelectorAll(".steps > li");
        const after = (el) => getComputedStyle(el, "::after").backgroundColor;
        // The connector traces the marker's border, not its fill: for a normal
        // step the marker is a filled disc with a --border ring.
        const markerBorder = (el) => getComputedStyle(el, "::before").borderTopColor;
        return {
          completeAfter: after(steps[0]),
          completeMarkerBorder: markerBorder(steps[0]),
          // steps[2] is the unmarked future step — a plain connector and marker.
          normalAfter: after(steps[2]),
          normalMarkerBorder: markerBorder(steps[2]),
        };
      })()`);

      // A complete step's connector matches its selected marker ring.
      expect(result.completeAfter).toBe(result.completeMarkerBorder);
      // A normal step's connector matches its (border-color) marker ring.
      expect(result.normalAfter).toBe(result.normalMarkerBorder);
      // The two connectors are visibly different: complete = selected,
      // normal = border.
      expect(result.completeAfter).not.toBe(result.normalAfter);
    },
    { artifactName: "steps" },
  );
});
