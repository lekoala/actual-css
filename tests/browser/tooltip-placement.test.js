/*
 * Where a tooltip element lives, and who owns that decision.
 *
 * The contract has two halves, because the two authoring forms have opposite
 * needs and no single placement satisfies both.
 *
 * Explicit (`data-tooltip` + aria-describedby + a role="tooltip" element):
 * the author placed it, so it stays there and inherits everything reaching it
 * — theme islands, density, .inverted, an application's own scoped custom
 * properties. This is the same defect class the surface transport removed;
 * see surface-inherited-context.test.js and
 * docs/design-notes/surface-reparenting.md.
 *
 * Shorthand (`data-tooltip="text"`): Actual generates the element, so Actual
 * owns the placement and it must be structurally neutral. Inserting next to
 * the trigger was evaluated and rejected: structural pseudo-classes are
 * DOM-based, and position: fixed does not exempt an element from :last-child.
 * A generated sibling would take `.join > :last-child` from the trigger and
 * silently drop the group's corner radius. The shorthand therefore does not
 * promise inheritance — authors who need it use the explicit form.
 *
 * Only a real browser resolves scoped custom properties through a cascade
 * loaded from a stylesheet, so both halves live here rather than in the unit
 * layer.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/tooltip-placement.html";
const TIMEOUT = 60_000;

const available = await browserAvailable();
const owed = (name, run) => (available ? test : test.skip)(name, run, TIMEOUT);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// The theme case reads --surface-solid, which is the contrasting solid rather
// than the surface itself: it is light inside a dark island and dark on a light
// page. Pinning the scheme keeps the island a real contrast instead of one that
// collapses whenever the host machine is in dark mode.
const OPTIONS = { mediaFeatures: [{ name: "prefers-color-scheme", value: "light" }] };

// Wiring is lazy: ensureTip() runs on the first mouseover, which is the moment
// the old transport moved an explicit tip out of its scope.
const hover = (view, selector) =>
  view.evaluate(`document.querySelector(${JSON.stringify(selector)}).dispatchEvent(
    new MouseEvent("mouseover", { bubbles: true })
  )`);

/*
 * Reads one computed value off a tip before and after its first hover, plus
 * the parent it is attached to. Any difference between the two reads is a
 * context loss; the parent read is the invariant the others depend on.
 */
async function acrossFirstHover(tipId, read) {
  let closed;
  let hovered;
  let reference;

  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const probe = (id) =>
        view.evaluate(`(() => {
          const tip = document.getElementById(${JSON.stringify(id)});
          const styles = getComputedStyle(tip);
          return JSON.stringify({
            parent: tip.parentElement.id || tip.parentElement.tagName,
            value: ${read},
          });
        })()`);

      closed = JSON.parse(await probe(tipId));
      reference = JSON.parse(await probe("ref-tip"));
      await hover(view, `[aria-describedby="${tipId}"]`);
      await sleep(300);
      hovered = JSON.parse(await probe(tipId));
    },
    { ...OPTIONS, artifactName: `tooltip-placement-${tipId}` },
  );

  // Author-owned placement: the tip is where it was written, before and after.
  expect(closed.parent).not.toBe("BODY");
  expect(hovered.parent).toBe(closed.parent);

  // The scope really did apply, and is not simply the document default.
  expect(closed.value).not.toBe(reference.value);

  return { closed, hovered };
}

owed("an explicit tooltip inside a theme island keeps that theme", async () => {
  const { closed, hovered } = await acrossFirstHover("theme-tip", "styles.backgroundColor");
  expect(hovered.value).toBe(closed.value);
});

owed("an explicit tooltip inside a density scope keeps that density", async () => {
  const { closed, hovered } = await acrossFirstHover(
    "density-tip",
    `styles.getPropertyValue('--control-size').trim()`,
  );
  expect(closed.value).toBe("2rem");
  expect(hovered.value).toBe("2rem");
});

owed("an explicit tooltip keeps an application's scoped custom property", async () => {
  const { closed, hovered } = await acrossFirstHover(
    "app-tip",
    `styles.getPropertyValue('--app-accent').trim()`,
  );
  expect(closed.value).toBe("rgb(1, 2, 3)");
  expect(hovered.value).toBe("rgb(1, 2, 3)");
});

owed("an explicit tooltip inside .inverted keeps the inverted surface tokens", async () => {
  const { closed, hovered } = await acrossFirstHover(
    "inverted-tip",
    `styles.getPropertyValue('--ui-fg').trim()`,
  );
  expect(hovered.value).toBe(closed.value);
});

owed("a shorthand tooltip does not alter the trigger's structural position", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const probe = () =>
        view
          .evaluate(`(() => {
            const trigger = document.getElementById("join-last");
            const tip = document.querySelector('#join-group [role="tooltip"]');
            return JSON.stringify({
              isLastChild: trigger.matches(":last-child"),
              // The user-visible consequence: .join > :last-child is what
              // gives the group its trailing corner.
              cornerRadius: getComputedStyle(trigger).borderEndEndRadius,
              siblingCount: document.getElementById("join-group").children.length,
              tipInsideJoin: !!tip,
            });
          })()`)
          .then(JSON.parse);

      const before = await probe();
      expect(before.isLastChild).toBe(true);
      expect(before.cornerRadius).not.toBe("0px");
      expect(before.tipInsideJoin).toBe(false);

      await hover(view, "#join-last");
      await sleep(300);

      // The tip exists now — this is not passing because nothing happened.
      expect(await view.evaluate(`document.querySelectorAll('[role="tooltip"]').length > 0`)).toBe(
        true,
      );

      const after = await probe();
      expect(after.tipInsideJoin).toBe(false);
      expect(after.siblingCount).toBe(before.siblingCount);
      expect(after.isLastChild).toBe(true);
      expect(after.cornerRadius).toBe(before.cornerRadius);
    },
    { ...OPTIONS, artifactName: "tooltip-placement-join" },
  );
});
