/*
 * Real-browser surface-role contract, driven over Bun.WebView.
 *
 * --surface-* may be translucent (the glass preset). A component that needs
 * to hide what lies beneath it reads --surface-opaque, and ink on
 * --surface-solid reads --surface-solid-fg. A glass experiment found both roles
 * borrowing --surface: a ring that cut nothing and tooltip text at 10% alpha.
 * .aura also relied on an opaque child to hide its frame, until its mask did,
 * and a stacked avatar's frosted fill showed the neighbour it overlaps.
 * Under a translucent palette every color below must stay opaque, so the next
 * var(--surface) used as a mask or as ink fails here.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";
import { RASTERIZE } from "../../scripts/utils/color.js";

const FIXTURE = "tests/browser/translucent-surface.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

it("masks and inverse ink stay opaque over translucent surfaces", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const colors = await view.evaluate(`(() => {
        const rgba = ${RASTERIZE};
        const cs = (id, pseudo) => getComputedStyle(document.getElementById(id), pseudo);
        // The leading color of a single computed box-shadow.
        const shadow = (value) => rgba(value.match(/^\\w+\\([^)]*\\)/)[0]);
        return {
          surface: rgba(cs("indicator").getPropertyValue("--surface")),
          indicatorRing: shadow(cs("indicator").boxShadow),
          stackRing: shadow(cs("stacked").boxShadow),
          // The fill itself may be translucent; the base under it hides the
          // overlapped neighbour.
          stackBase: rgba(cs("stacked").backgroundColor),
          meterSeparator: rgba(cs("meter-segment").borderInlineStartColor),
          currentMarker: rgba(cs("step-current", "::before").backgroundColor),
          upcomingMarker: rgba(cs("step-upcoming", "::before").backgroundColor),
          auraMask: rgba(cs("aura", "::after").backgroundColor),
          tooltipInk: rgba(cs("tooltip").color),
          statusInk: rgba(cs("status").color),
        };
      })()`);

      // The fixture only proves anything while the palette is translucent.
      expect(colors.surface[3]).toBeLessThan(255);

      const { surface, ...roles } = colors;
      for (const [role, [, , , alpha]] of Object.entries(roles)) {
        expect({ role, alpha }).toEqual({ role, alpha: 255 });
      }
    },
    { artifactName: "translucent-surface" },
  );
});
