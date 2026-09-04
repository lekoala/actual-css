/*
 * A surface is presented in its trigger's context, not the document's.
 *
 * The transport promotes the panel to the top layer without moving it, so
 * every scope that reaches it by inheritance — theme islands, density,
 * .inverted, and any custom property an application scoped to a container —
 * still reaches it once it opens. These assertions are the contract, written
 * against the defect that reparenting used to cause; they are the reason the
 * transport exists, so keep them phrased as before/after comparisons rather
 * than as absolute values a fixture edit could satisfy by accident.
 *
 * See docs/design-notes/surface-reparenting.md.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/surface-inherited-context.html";
const TIMEOUT = 60_000;

const available = await browserAvailable();
const owed = (name, run) => (available ? test : test.skip)(name, run, TIMEOUT);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/*
 * Reads one computed value off a panel before and after it opens, plus the
 * parent it is attached to. Opening is the moment the old transport relocated
 * the panel, so any difference between the two reads is a context loss.
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

  // The invariant every case below depends on: inheritance can only survive if
  // the panel is still attached where it was authored.
  expect(open.parent).toBe(closed.parent);

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
