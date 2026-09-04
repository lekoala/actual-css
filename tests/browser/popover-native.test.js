/*
 * Real-browser presentation contract for a natively managed popover.
 *
 * Actual advertises .flyout and .tooltip as composable with a browser-owned
 * popover lifecycle, so the presentation has to hand the states the platform
 * owns back to the platform. Two of those are easy to get wrong from CSS alone
 * and invisible to a static audit, which is why this runs in a real engine:
 *
 *   - a closed popover must not be rendered. .flyout declares display: grid,
 *     and an author declaration beats the UA origin whatever the specificity,
 *     so without an explicit :not(:popover-open) rule the panel stays painted
 *     at its static position with no way to dismiss it.
 *   - the exit must actually fade. overlay + display allow-discrete only hold
 *     the element in the top layer; they animate nothing on their own, so the
 *     closed state needs the same opacity target the [hidden] runtime state
 *     has, or the panel is held fully opaque and then snaps away.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/popover-native.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// --duration-fast is 100ms; sample the transitions well inside that window.
const MID_TRANSITION_MS = 40;

function reader(view) {
  return async (id) => {
    const raw = await view.evaluate(`(() => {
      const el = document.getElementById(${JSON.stringify(id)});
      const rect = el.getBoundingClientRect();
      const styles = getComputedStyle(el);
      return JSON.stringify({
        open: el.matches(":popover-open"),
        display: styles.display,
        opacity: Number(styles.opacity),
        boxed: rect.width > 0 && rect.height > 0,
      });
    })()`);
    return JSON.parse(raw);
  };
}

it("a closed native popover is not rendered, and an open one fades in and out", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const read = reader(view);
      const show = (id) => view.evaluate(`document.getElementById("${id}").showPopover()`);
      const hide = (id) => view.evaluate(`document.getElementById("${id}").hidePopover()`);

      expect(await view.evaluate(`"popover" in HTMLElement.prototype`)).toBe(true);

      // Never opened: the platform's hidden state must survive .flyout's own
      // display: grid, so there is no stray panel and nothing to dismiss.
      const closed = await read("native-flyout");
      expect(closed.open).toBe(false);
      expect(closed.display).toBe("none");
      expect(closed.boxed).toBe(false);

      // Entry fades from the closed opacity rather than appearing at full.
      await show("native-flyout");
      await sleep(MID_TRANSITION_MS);
      const entering = await read("native-flyout");
      expect(entering.open).toBe(true);
      expect(entering.display).toBe("grid");
      expect(entering.opacity).toBeLessThan(1);

      await sleep(400);
      const open = await read("native-flyout");
      expect(open.display).toBe("grid");
      expect(open.opacity).toBe(1);

      // Exit: still painted (overlay/display held discrete) while fading out.
      await hide("native-flyout");
      await sleep(MID_TRANSITION_MS);
      const exiting = await read("native-flyout");
      expect(exiting.open).toBe(false);
      expect(exiting.display).toBe("grid");
      expect(exiting.opacity).toBeLessThan(1);

      await sleep(400);
      const settled = await read("native-flyout");
      expect(settled.display).toBe("none");
      expect(settled.boxed).toBe(false);

      // Tooltip: the UA already hides it, but it must fade out the same way.
      await show("native-tooltip");
      await sleep(400);
      expect((await read("native-tooltip")).opacity).toBe(1);

      await hide("native-tooltip");
      await sleep(MID_TRANSITION_MS);
      const tipExiting = await read("native-tooltip");
      expect(tipExiting.opacity).toBeLessThan(1);

      await sleep(400);
      expect((await read("native-tooltip")).display).toBe("none");
    },
    {
      artifactName: "popover-native",
      // Pin motion on: the reduced-motion reset collapses every transition to
      // 0.01ms, which would make the fade samples meaningless.
      mediaFeatures: [{ name: "prefers-reduced-motion", value: "no-preference" }],
    },
  );
});
