import { expect, test } from "bun:test";
import {
  browserAvailable,
  clickSelector,
  finishAnimations,
  fixtureUrl,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const baseTest = (await browserAvailable()) ? test : test.skip;
// Chrome startup and the source CSS import tree outlast bun's 5s default on CI.
const it = (name, run) => baseTest(name, run, 60_000);

for (const page of ["reveal", "mark-sweep"]) {
  it(`replays every ${page} demo repeatedly`, async () => {
    await withBrowserPage(
      fixtureUrl(`site/components/${page}.html`),
      async (view) => {
        await waitForBrowser(view, 'document.querySelectorAll(".docs-replay").length === 2');
        for (let index = 0; index < 2; index++) {
          // Use a stable handle: prose sections also participate in nth-of-type.
          await view.evaluate(`(() => {
            const example = document.querySelectorAll('.docs-example')[${index}];
            example.id = 'replay-example';
            example.scrollIntoView({ block: 'center' });
          })()`);
          const target = "#replay-example .docs-preview";
          await waitForBrowser(view, `!document.querySelector('${target} .is-pending')`);
          await finishAnimations(view, target);
          await waitForBrowser(
            view,
            `document.querySelector('${target}').getAnimations({ subtree: true }).length === 0`,
          );
          for (let run = 0; run < 2; run++) {
            await clickSelector(view, "#replay-example .docs-replay");
            await waitForBrowser(
              view,
              `document.querySelector('${target}').getAnimations({ subtree: true }).length > 0`,
            );
            expect(
              await view.evaluate(`document.querySelector('${target} .is-pending') === null`),
            ).toBe(true);
            await finishAnimations(view, target);
            await waitForBrowser(
              view,
              `document.querySelector('${target}').getAnimations({ subtree: true }).length === 0`,
            );
          }
          await view.evaluate("document.getElementById('replay-example').removeAttribute('id')");
        }
      },
      { sourceCss: true },
    );
  });
}

it("replay keeps reduced-motion effects visible without animation", async () => {
  await withBrowserPage(
    fixtureUrl("site/enhancements/in-view.html"),
    async (view) => {
      await waitForBrowser(view, 'document.querySelector(".docs-replay") !== null');
      await view.evaluate(
        'document.querySelector(".docs-replay").scrollIntoView({ block: "center" })',
      );
      await clickSelector(view, ".docs-replay");
      expect(
        await view.evaluate(`(() => {
        const preview = document.querySelector('.docs-preview');
        return {
          animations: preview.getAnimations({ subtree: true }).length,
          opacity: getComputedStyle(preview.querySelector('.reveal')).opacity,
          highlight: getComputedStyle(preview.querySelector('.mark-sweep')).backgroundSize,
          pending: preview.querySelector('.is-pending') !== null,
        };
      })()`),
      ).toEqual({ animations: 0, opacity: "1", highlight: "100% 100%", pending: false });
    },
    { sourceCss: true, mediaFeatures: [{ name: "prefers-reduced-motion", value: "reduce" }] },
  );
});
