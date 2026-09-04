/*
 * Known defect: surface reparenting severs inherited presentation context.
 *
 * surface.js moves an open surface to the nearest dialog or to body so it
 * escapes overflow clipping and z-index stacking. That move also takes the
 * panel out of every scope that reached it by inheritance — theme islands,
 * density, .inverted, and any custom property an application scoped to a
 * container. The panel is styled by its ancestors right up to the moment it
 * becomes visible, and by different ancestors from then on.
 *
 * See docs/design-notes/surface-reparenting.md. These tests describe the
 * behavior Actual owes its own documented contracts, so they are marked
 * `test.failing` while the defect stands: the suite stays green, and the day
 * the transport stops reparenting they turn red as unexpected passes, which is
 * the signal to drop the marker rather than the assertions.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/surface-inherited-context.html";
const TIMEOUT = 60_000;

const available = await browserAvailable();
/*
 * Not abandoned tests: the assertions are the contract, and test.failing is
 * what keeps them honest while the defect stands. Do not delete them, and do
 * not relax them to match today's behavior — see
 * docs/design-notes/surface-reparenting.md.
 */
const owed = (name, run) => (available ? test.failing : test.skip)(name, run, TIMEOUT);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/*
 * Reads one computed value off a panel before and after it opens. Opening is
 * what triggers the reparenting, so a difference between the two is the defect.
 */
async function acrossOpen(panelId, read) {
  let closed;
  let open;

  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const probe = () =>
        view.evaluate(`(() => {
          const panel = document.getElementById(${JSON.stringify(panelId)});
          const styles = getComputedStyle(panel);
          return JSON.stringify({
            parent: panel.parentElement.id || panel.parentElement.tagName,
            value: ${read},
          });
        })()`);

      closed = JSON.parse(await probe());
      await view.evaluate(`document.querySelector('[aria-controls="${panelId}"]').click()`);
      await sleep(250);
      open = JSON.parse(await probe());
    },
    { artifactName: `surface-context-${panelId}` },
  );

  return { closed, open };
}

owed("a flyout inside a theme island keeps that theme when it opens", async () => {
  const { closed, open } = await acrossOpen("theme-panel", "styles.backgroundColor");

  // Sanity: the scope really did apply while the panel was closed.
  expect(closed.value).not.toBe("rgb(255, 255, 255)");
  expect(open.value).toBe(closed.value);
});

owed("a flyout inside a density scope keeps that density when it opens", async () => {
  const { closed, open } = await acrossOpen(
    "density-panel",
    `styles.getPropertyValue('--control-size').trim()`,
  );

  expect(closed.value).toBe("2rem");
  expect(open.value).toBe("2rem");
});

owed("a flyout keeps an application's scoped custom property when it opens", async () => {
  const { closed, open } = await acrossOpen(
    "app-panel",
    `styles.getPropertyValue('--app-accent').trim()`,
  );

  expect(closed.value).toBe("rgb(1, 2, 3)");
  expect(open.value).toBe("rgb(1, 2, 3)");
});
