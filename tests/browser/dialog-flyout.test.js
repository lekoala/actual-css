import { expect, test } from "bun:test";
import {
  browserAvailable,
  clickSelector,
  fixtureUrl,
  pressKey,
  tabUntil,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const FIXTURE = fixtureUrl("tests/browser/dialog-flyout.html");
const TIMEOUT = 60_000;
const it = (await browserAvailable()) ? test : test.skip;

const bundle = await Bun.build({ entrypoints: ["src/js/full.js"], format: "iife", write: false });
if (!bundle.success) throw new AggregateError(bundle.logs, "Runtime test bundle failed");
const runtime = `(() => { ${await bundle.outputs[0].text()} })()`;

const flyoutOpen = 'document.getElementById("actions").matches(":popover-open")';
const dialogOpen = 'document.getElementById("details").matches(":modal")';
const focusIs = (id) => `document.activeElement?.id === ${JSON.stringify(id)}`;

it(
  "Escape returns focus to the actual flyout opener while its exit animation is still running",
  async () => {
    await withBrowserPage(
      FIXTURE,
      async (view) => {
        await view.evaluate(runtime);
        // Hold the closed panel's box through the close event so a layout-box
        // check alone would still mistake its command for a live target.
        await view.evaluate(`document.head.appendChild(document.createElement("style")).textContent =
          ".flyout[popover]:not(:popover-open) { transition-duration: 60s; }"`);
        await clickSelector(view, "#second-trigger");
        await waitForBrowser(view, flyoutOpen);
        await clickSelector(view, "#edit");
        await waitForBrowser(view, `${dialogOpen} && !(${flyoutOpen}) && ${focusIs("save")}`);
        expect(
          await view.evaluate('document.getElementById("edit").getClientRects().length'),
        ).toBeGreaterThan(0);

        await pressKey(view, "Escape");
        await waitForBrowser(view, `!(${dialogOpen}) && ${focusIs("second-trigger")}`);
      },
      { sourceCss: true },
    );
  },
  TIMEOUT,
);

for (const { name, autoClose, disableCommand, focusTarget } of [
  { name: "closes", autoClose: true, focusTarget: "first-trigger" },
  { name: "stays open", autoClose: false, focusTarget: "edit" },
  {
    name: "stays open with a disabled command",
    autoClose: false,
    disableCommand: true,
    focusTarget: "first-trigger",
  },
]) {
  it(
    `keyboard activation and form submission restore focus when the flyout ${name}`,
    async () => {
      await withBrowserPage(
        FIXTURE,
        async (view) => {
          await view.evaluate(
            `document.getElementById("actions").dataset.flyoutAutoClose = "${autoClose}"`,
          );
          await view.evaluate(runtime);
          expect(await tabUntil(view, focusIs("first-trigger"))).toBe(true);
          await pressKey(view, "Enter");
          await waitForBrowser(view, `${flyoutOpen} && ${focusIs("edit")}`);
          await pressKey(view, "Enter");
          await waitForBrowser(view, `${dialogOpen} && ${focusIs("save")}`);
          expect(await view.evaluate(flyoutOpen)).toBe(!autoClose);
          if (disableCommand)
            await view.evaluate('document.getElementById("edit").disabled = true');

          await pressKey(view, "Enter");
          await waitForBrowser(view, `!(${dialogOpen}) && ${focusIs(focusTarget)}`);
          expect(await view.evaluate('document.getElementById("details").returnValue')).toBe(
            "saved",
          );
          expect(await view.evaluate(flyoutOpen)).toBe(!autoClose);
        },
        { sourceCss: true },
      );
    },
    TIMEOUT,
  );
}
