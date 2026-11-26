/* Selection survives hover, touch activation and keyboard focus on both forms. */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  clickSelector,
  fixtureUrl,
  forceStates,
  pressKey,
  tabUntil,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, 60_000);

function state(view, id) {
  return view.evaluate(`(() => {
    const label = document.getElementById(${JSON.stringify(id)});
    const style = getComputedStyle(label);
    const input = label.querySelector("input");
    return {
      border: style.borderTopColor,
      selected: getComputedStyle(label, label.matches(".chip") ? "::after" : "::before").backgroundColor,
      checked: input.checked,
      focused: input === document.activeElement,
      focusVisible: input.matches(":focus-visible"),
      outline: style.outlineStyle,
    };
  })()`);
}

const settled = (view) => waitForBrowser(view, "document.getAnimations().length === 0");

for (const [fixture, id] of [
  ["choice-chip", "design"],
  ["choice-card", "me"],
]) {
  it(`${fixture}: hover preserves selection and keyboard focus`, async () => {
    await withBrowserPage(fixtureUrl(`tests/browser/${fixture}.html`), async (view) => {
      const resting = await state(view, id);
      const canHover = await view.evaluate('matchMedia("(hover: hover)").matches');
      await forceStates(view, { [`#${id}`]: ["hover"] });
      await settled(view);
      expect((await state(view, id)).border === resting.border).toBe(!canHover);

      await clickSelector(view, `#${id}`);
      await settled(view);
      const selected = await state(view, id);
      expect(selected.checked).toBe(true);
      expect(selected.focused).toBe(true);
      expect(selected.focusVisible).toBe(false);
      expect(selected.outline).toBe("none");
      expect(selected.border).toBe(selected.selected);

      await forceStates(view, { [`#${id}`]: [] });
      await settled(view);
      expect((await state(view, id)).border).toBe(selected.border);

      // Leave and return through real keyboard input to switch focus modality.
      await pressKey(view, "Tab");
      expect(
        await tabUntil(view, `document.activeElement === document.querySelector("#${id} input")`),
      ).toBe(true);
      const keyboard = await state(view, id);
      expect(keyboard.focusVisible).toBe(true);
      expect(keyboard.outline).toBe("solid");
      expect(keyboard.border).toBe(selected.border);
    });
  });

  it(`${fixture}: touch selects without a persistent hover or focus paint`, async () => {
    await withBrowserPage(fixtureUrl(`tests/browser/${fixture}.html`), async (view) => {
      await view.cdp("Emulation.setTouchEmulationEnabled", { enabled: true });
      expect(await view.evaluate('matchMedia("(hover: none)").matches')).toBe(true);
      const resting = await state(view, id);
      // Model sticky :hover even on Chromium versions that clear it after touch.
      await forceStates(view, { [`#${id}`]: ["hover"] });
      await settled(view);
      expect((await state(view, id)).border).toBe(resting.border);

      const point = await view.evaluate(`(() => {
        const rect = document.getElementById(${JSON.stringify(id)}).getBoundingClientRect();
        return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
      })()`);
      await view.cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
      await view.cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await waitForBrowser(view, `document.querySelector("#${id} input").checked`);
      await settled(view);
      const touched = await state(view, id);
      expect(touched.border).toBe(touched.selected);
      expect(touched.focusVisible).toBe(false);
      expect(touched.outline).toBe("none");
    });
  });
}
