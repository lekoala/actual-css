import { expect, test } from "bun:test";
import {
  browserAvailable,
  clickSelector,
  fixtureUrl,
  setViewport,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const it = (await browserAvailable()) ? test : test.skip;
const page = fixtureUrl("demo/templates/appearance.html");

it("appearance examples release on scroll and replay independently", async () => {
  await withBrowserPage(
    page,
    async (view) => {
      await waitForBrowser(
        view,
        'document.querySelectorAll("[data-replay]:not([hidden])").length === 7',
      );
      for (let index = 0; index < 7; index++) {
        await view.evaluate(`(() => {
        const example = document.querySelectorAll('[data-example]')[${index}];
        example.id = 'active-example';
        example.querySelector('.effects-stage').scrollIntoView({ block: 'center' });
      })()`);
        const stage = 'document.querySelector("#active-example .effects-stage")';
        await waitForBrowser(
          view,
          `!${stage}.querySelector('.is-pending') && ${stage}.getAnimations({ subtree: true }).length === 0`,
        );
        const source = await view.evaluate(
          'document.querySelector("#active-example [data-source]").textContent',
        );
        expect(source).toContain('data-enhance="in-view"');
        expect(source).not.toContain("is-pending");
        for (let run = 0; run < 2; run++) {
          await view.evaluate(
            'document.querySelector("#active-example [data-replay]").scrollIntoView({ block: "center" })',
          );
          await clickSelector(view, "#active-example [data-replay]");
          await waitForBrowser(view, `${stage}.getAnimations({ subtree: true }).length > 0`);
          expect(
            await view.evaluate('document.activeElement.matches("#active-example [data-replay]")'),
          ).toBe(true);
          await waitForBrowser(view, `${stage}.getAnimations({ subtree: true }).length === 0`);
        }
        await view.evaluate('document.querySelector("#active-example").removeAttribute("id")');
      }
    },
    { sourceCss: true },
  );
}, 30_000);

it("slow motion stretches built-in and site-defined effects", async () => {
  await withBrowserPage(
    page,
    async (view) => {
      await waitForBrowser(view, 'document.querySelector("[data-replay]:not([hidden])")');
      const timings = () =>
        view.evaluate(`(() => {
      const style = selector => getComputedStyle(document.querySelector(selector));
      return [
        style('.reveal').getPropertyValue('--reveal-duration'),
        style('.mark-sweep').getPropertyValue('--mark-sweep-duration'),
        style('.site-arrival').transitionDuration.split(',')[0],
      ].map(value => parseFloat(value) * (value.trim().endsWith('ms') ? 1 : 1000));
    })()`);
      const normal = await timings();
      await clickSelector(view, "#slow-motion");
      const slow = await timings();
      for (let index = 0; index < normal.length; index++)
        expect(slow[index]).toBeGreaterThan(normal[index]);
      await clickSelector(view, "#slow-motion");
      expect(await timings()).toEqual(normal);
    },
    { sourceCss: true },
  );
});

it("reduced motion keeps every effect visible, including custom transitions", async () => {
  await withBrowserPage(
    page,
    async (view) => {
      await waitForBrowser(view, 'document.querySelector("#slow-motion").disabled');
      await view.evaluate(
        `document.querySelectorAll('[data-effect]').forEach(element => element.classList.add('is-pending'))`,
      );
      expect(
        await view.evaluate(`(() => {
      const targets = document.querySelectorAll('[data-effect]:not(.reveal-group), .reveal-group > *');
      return [...targets].every(element => {
        const style = getComputedStyle(element);
        return style.opacity === '1' && style.translate === 'none' && style.scale === 'none'
          && element.getAnimations().length === 0;
      });
    })()`),
      ).toBe(true);
      expect(
        await view.evaluate(
          'getComputedStyle(document.querySelector(".mark-sweep")).backgroundSize',
        ),
      ).toBe("100% 100%");
    },
    { sourceCss: true, mediaFeatures: [{ name: "prefers-reduced-motion", value: "reduce" }] },
  );
});

it("the catalogue and expanded source fit narrow and wide viewports", async () => {
  await withBrowserPage(
    page,
    async (view) => {
      await waitForBrowser(view, 'document.querySelector("[data-source]").textContent.length > 0');
      await view.evaluate(
        'document.querySelectorAll("details").forEach(element => element.open = true)',
      );
      for (const width of [360, 1280]) {
        await setViewport(view, { width });
        expect(await view.evaluate("document.documentElement.scrollWidth <= innerWidth")).toBe(
          true,
        );
      }
    },
    { sourceCss: true },
  );
});
