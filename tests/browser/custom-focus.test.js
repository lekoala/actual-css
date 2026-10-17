/* The documented focus recipe must win over both hover paints, keeping elevation and outline. */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  elementRect,
  fixtureUrl,
  forceStates,
  tabUntil,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/custom-focus.html";
const it = (await browserAvailable()) ? test : test.skip;

test("the focus fixture uses the documented recipe", async () => {
  const docs = await Bun.file("docs/pages/foundations/theming.md").text();
  const recipe = docs.match(
    /### Customize focus beyond the ring[\s\S]*?```css\n([\s\S]*?)\n```/,
  )?.[1];
  expect(recipe).toBeDefined();
  expect(await Bun.file(FIXTURE).text()).toContain(recipe);
});

const read = (id) => `(() => {
  const el = document.getElementById(${JSON.stringify(id)});
  const style = getComputedStyle(el);
  const reference = getComputedStyle(document.getElementById("reference"));
  return {
    focus: el.matches(":focus-visible"), hover: el.matches(":hover"),
    background: style.backgroundColor, color: style.color, border: style.borderTopColor,
    shadow: style.boxShadow, outline: style.outlineStyle,
    outlineColor: style.outlineColor, width: parseFloat(style.outlineWidth),
    offset: parseFloat(style.outlineOffset),
    expected: { background: reference.backgroundColor, color: reference.color,
      border: reference.borderTopColor },
  };
})()`;

for (const scheme of ["light", "dark"]) {
  for (const forced of [false, true]) {
    it(`custom focus and hover in ${scheme}, forced colors: ${forced}`, async () => {
      await withBrowserPage(
        fixtureUrl(FIXTURE),
        async (view) => {
          for (const id of ["solid", "soft", "outline"]) {
            // Move away before Tab: pointer movement must never substitute for keyboard focus.
            await view.cdp("Input.dispatchMouseEvent", { type: "mouseMoved", x: 0, y: 0 });
            expect(
              await tabUntil(view, `document.activeElement?.id === ${JSON.stringify(id)}`),
            ).toBe(true);
            await waitForBrowser(
              view,
              `document.getElementById(${JSON.stringify(id)}).matches(":focus-visible")`,
            );
            const focus = await view.evaluate(read(id));
            expect(focus.focus).toBe(true);
            expect(focus.hover).toBe(false);
            expect(focus.outline).toBe("solid");
            expect(focus.width).toBeGreaterThan(0);
            expect(focus.offset).toBeGreaterThan(0);
            expect(focus.outlineColor).not.toBe(focus.background);
            if (!forced) {
              expect(focus.background).toBe(focus.expected.background);
              expect(focus.color).toBe(focus.expected.color);
              expect(focus.border).toBe(focus.expected.border);
              expect(focus.shadow).toBe("rgb(0, 0, 0) 3px 3px 0px 0px");
            }
            const rect = await elementRect(view, `#${id}`);
            await view.cdp("Input.dispatchMouseEvent", {
              type: "mouseMoved",
              x: rect.x + rect.width / 2,
              y: rect.y + rect.height / 2,
            });
            await waitForBrowser(
              view,
              `document.getElementById(${JSON.stringify(id)}).matches(":hover:focus-visible")`,
            );
            const hover = await view.evaluate(read(id));
            expect(hover.focus).toBe(true);
            expect(hover.hover).toBe(true);
            for (const property of [
              "background",
              "color",
              "border",
              "outline",
              "outlineColor",
              "width",
              "offset",
            ]) {
              expect(hover[property], property).toBe(focus[property]);
            }
            if (!forced) {
              expect(hover.shadow).toBe(
                `${focus.shadow}, rgba(0, 0, 0, 0) 0px 0px 0px 999px inset`,
              );
            } else {
              expect(hover.shadow).toBe("none");
            }
          }
          // A focusable aria-disabled link must retain its disabled treatment.
          const disabled = await view.evaluate(read("disabled-link"));
          expect(await tabUntil(view, `document.activeElement?.id === "disabled-link"`)).toBe(true);
          const focusedDisabled = await view.evaluate(read("disabled-link"));
          expect(focusedDisabled.background).toBe(disabled.background);
          expect(focusedDisabled.color).toBe(disabled.color);
          const disabledButton = await view.evaluate(read("disabled"));
          await forceStates(view, { "#disabled": ["focus", "focus-visible"] });
          expect((await view.evaluate(read("disabled"))).background).toBe(
            disabledButton.background,
          );
        },
        {
          mediaFeatures: [
            { name: "prefers-color-scheme", value: scheme },
            { name: "forced-colors", value: forced ? "active" : "none" },
          ],
          artifactName: "custom-focus",
        },
      );
    }, 60_000);
  }
}
