/*
 * Real-browser input-icon geometry, driven over Bun.WebView.
 *
 * The icon position is inferred from DOM order: a non-.input child before the
 * input is the leading icon, one after it is the trailing icon. This fixture
 * covers all three configurations, including leading + trailing together,
 * which the position rules must handle with one input and two icons.
 *
 * The reserved padding is asserted relative to a bare control, so the test
 * survives a change to the control padding token.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/input-icon.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

const px = (value) => Number.parseFloat(value);

it("input-icon positions one or two icons and reserves their space", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const snapshot = await view.evaluate(`(() => {
        const input = (id) => getComputedStyle(document.querySelector("#" + id + " > .input"));
        const rect = (el) => el.getBoundingClientRect();
        const wrap = (id) => rect(document.querySelector("#" + id));
        const icon = (id, index) =>
          rect(document.querySelectorAll("#" + id + " > :not(.input)")[index]);
        const bare = getComputedStyle(document.querySelector("#plain"));
        const edges = (id, count) => {
          const w = wrap(id);
          const lead = icon(id, 0);
          const trail = icon(id, count - 1);
          return {
            width: w.width,
            leadLeft: lead.left - w.left,
            trailRight: w.right - trail.right,
          };
        };
        return {
          plain: { left: bare.paddingLeft, right: bare.paddingRight },
          leading: {
            padLeft: input("leading").paddingLeft,
            padRight: input("leading").paddingRight,
            ...edges("leading", 1),
          },
          trailing: {
            padLeft: input("trailing").paddingLeft,
            padRight: input("trailing").paddingRight,
            ...edges("trailing", 1),
          },
          both: {
            padLeft: input("both").paddingLeft,
            padRight: input("both").paddingRight,
            ...edges("both", 2),
          },
          large: {
            padLeft: input("large").paddingLeft,
            contentStart: rect(document.querySelector("#large > .input")).left,
            iconRight: icon("large", 0).right,
          },
        };
      })()`);

      // A pin is a small inset from the wrapper edge; a misplaced icon (the
      // static-position fallback) reports the full wrapper width instead.
      const pinned = (offset, width) => offset >= 0 && offset < width / 4;

      // Leading only: the icon is pinned to the inline-start edge, and the
      // input reserves start space.
      expect(pinned(snapshot.leading.leadLeft, snapshot.leading.width)).toBe(true);
      expect(px(snapshot.leading.padLeft)).toBeGreaterThan(px(snapshot.plain.left));
      expect(snapshot.leading.padRight).toBe(snapshot.plain.right);

      // Trailing only: the icon is pinned to the inline-end edge, and the
      // input reserves end space.
      expect(pinned(snapshot.trailing.trailRight, snapshot.trailing.width)).toBe(true);
      expect(px(snapshot.trailing.padRight)).toBeGreaterThan(px(snapshot.plain.right));
      expect(snapshot.trailing.padLeft).toBe(snapshot.plain.left);

      // Leading + trailing: both icons pin to their edge, and the single input
      // reserves both insets. This is the regression the fixture guards.
      expect(pinned(snapshot.both.leadLeft, snapshot.both.width)).toBe(true);
      expect(pinned(snapshot.both.trailRight, snapshot.both.width)).toBe(true);
      expect(snapshot.both.padLeft).toBe(snapshot.leading.padLeft);
      expect(snapshot.both.padRight).toBe(snapshot.trailing.padRight);
      expect(snapshot.both.padLeft).toBe(snapshot.both.padRight);

      // Oversized icon: the glyph must sit inside the space the input reserves,
      // i.e. the inset and the padding share the control's frame.
      expect(snapshot.large.iconRight).toBeLessThanOrEqual(
        snapshot.large.contentStart + px(snapshot.large.padLeft),
      );
    },
    { artifactName: "input-icon" },
  );
});
