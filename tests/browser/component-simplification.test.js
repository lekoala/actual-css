import { expect, test } from "bun:test";
import {
  browserAvailable,
  fixtureUrl,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const baseTest = (await browserAvailable()) ? test : test.skip;
// Chrome startup and source import loading share the browser suite's timeout.
const it = (name, run) => baseTest(name, run, 60_000);
const fixture = fixtureUrl("tests/browser/component-simplification.html");

it("avatar child sizes cannot change the stack size or overlap", async () => {
  await withBrowserPage(fixture, async (view) => {
    const result = await view.evaluate(`(() => {
      const stack = id => {
        const el = document.getElementById(id);
        return {
          overlap: getComputedStyle(el).getPropertyValue('--avatar-stack-overlap'),
          widths: [...el.children].map(child => child.getBoundingClientRect().width),
        };
      };
      return { small: stack('small'), mixed: stack('mixed'), large: stack('large') };
    })()`);
    expect(result.small.widths[0]).toBe(result.small.widths[1]);
    expect(result.large.widths[0]).toBe(result.large.widths[1]);
    expect(result.large.widths[0]).toBeGreaterThan(result.small.widths[0]);
    expect(result.mixed.widths[0]).toBe(result.small.widths[0]);
    expect(result.mixed.widths[1]).toBe(result.large.widths[0]);
    expect(result.mixed.overlap).toBe(result.small.overlap);
  });
});

for (const reduced of [false, true]) {
  it(`drawer keeps entry, exit and backdrop motion${reduced ? " with reduced motion" : ""}`, async () => {
    await withBrowserPage(
      fixture,
      async (view) => {
        const snapshot = () =>
          view.evaluate(`(() => {
        const el = document.getElementById('drawer');
        const panel = getComputedStyle(el);
        const backdrop = getComputedStyle(el, '::backdrop');
        return {
          duration: panel.transitionDuration,
          easing: panel.transitionTimingFunction,
          backdropDuration: backdrop.transitionDuration,
          backdropEasing: backdrop.transitionTimingFunction,
          properties: panel.transitionProperty,
          behavior: panel.transitionBehavior,
        };
      })()`);
        const closed = await snapshot();
        await view.evaluate("document.getElementById('drawer').showModal()");
        if (!reduced)
          await waitForBrowser(
            view,
            "document.getElementById('drawer').getAnimations().length > 0",
          );
        const open = await snapshot();
        expect(open.properties).toBe("opacity, transform, overlay, display");
        expect(open.behavior).toContain("allow-discrete");
        expect(open.easing).not.toBe(closed.easing);
        expect(open.backdropEasing).toBe("ease");
        expect(open.duration).toBe(open.backdropDuration);
        if (reduced) expect(parseFloat(open.duration)).toBeLessThanOrEqual(0.00001);
        else expect(parseFloat(open.duration)).toBeGreaterThan(parseFloat(closed.duration));
        await waitForBrowser(
          view,
          "document.getElementById('drawer').getAnimations().length === 0",
        );
        await view.evaluate("document.getElementById('drawer').close()");
        const exit = await snapshot();
        expect(exit.duration).toBe(closed.duration);
        expect(exit.easing).toBe(closed.easing);
        expect(exit.backdropDuration).toBe(exit.duration);
        expect(exit.backdropEasing).toBe("ease");
        await waitForBrowser(
          view,
          "getComputedStyle(document.getElementById('drawer')).display === 'none'",
        );
      },
      {
        mediaFeatures: [
          { name: "prefers-reduced-motion", value: reduced ? "reduce" : "no-preference" },
        ],
      },
    );
  });
}
