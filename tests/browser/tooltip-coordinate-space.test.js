/*
 * Which coordinate space a tooltip is written in, and what it buys.
 *
 * Browsers scroll asynchronously: the page can move before any script runs. A
 * fixed tip therefore waits for the next autoUpdate() frame and visibly trails
 * its trigger, which is the wobble seen on touch devices. A tip written in
 * document coordinates is carried by the browser along with the page instead,
 * and needs no correction at all.
 *
 * That only holds while the trigger scrolls with the page. Against a
 * viewport-anchored trigger — a fixed bar, or anything inside a modal dialog,
 * which is laid out against the viewport while the page keeps scrolling behind
 * it — the browser would carry the tip away and every update would snap it
 * back, so those keep fixed coordinates.
 *
 * Only a real browser can settle any of this: the space is chosen from
 * computed positions, :modal and the top layer, and the whole point is what
 * happens between a scroll and the next frame. Every probe below therefore
 * scrolls and measures inside one task, before rAF can run — that gap is
 * exactly the lag under test.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/tooltip-coordinate-space.html";
const TIMEOUT = 60_000;
/* The `distance` tooltip.js passes to reposition(). */
const DISTANCE = 6;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const withPage = (name, run) =>
  withBrowserPage(fixtureUrl(FIXTURE), run, {
    artifactName: `tooltip-coordinate-space-${name}`,
    mediaFeatures: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });

const READERS = `
  const tipOf = (trigger) =>
    document.getElementById(trigger.getAttribute("aria-describedby"));
  /* Vertical gap between the trigger and its tip, in viewport space. The
     number itself is placement noise; that it does not change across a scroll
     is the contract. */
  const gap = (id) => {
    const trigger = document.getElementById(id);
    const tip = tipOf(trigger);
    return Math.round(tip.getBoundingClientRect().top - trigger.getBoundingClientRect().top);
  };
  /* Distance between the nearest edges, whichever side the tip resolved to.
     The engine keeps the requested distance there, so this catches a tip that
     is stable against its trigger while sitting a page scroll away from it. */
  const attach = (id) => {
    const t = document.getElementById(id).getBoundingClientRect();
    const p = tipOf(document.getElementById(id)).getBoundingClientRect();
    return Math.round(p.top >= t.bottom ? p.top - t.bottom : t.top - p.bottom);
  };
  const show = (id) => document.getElementById(id).dispatchEvent(
    new MouseEvent("mouseover", { bubbles: true })
  );
`;

/* Shows a tip, then scrolls and re-measures without yielding, so no
   autoUpdate() frame can paper over a tip that failed to follow. */
async function acrossSyncScroll(view, id, { from, by }) {
  await view.evaluate(`(() => {
    ${READERS}
    window.scrollTo(0, ${from});
    show(${JSON.stringify(id)});
  })()`);
  await sleep(300);
  return JSON.parse(
    await view.evaluate(`(() => {
      ${READERS}
      const tip = tipOf(document.getElementById(${JSON.stringify(id)}));
      const attached = attach(${JSON.stringify(id)});
      const before = gap(${JSON.stringify(id)});
      window.scrollBy(0, ${by});
      return JSON.stringify({
        position: getComputedStyle(tip).position,
        open: tip.matches(":popover-open"),
        attached,
        before,
        after: gap(${JSON.stringify(id)}),
      });
    })()`),
  );
}

it("a tip whose trigger scrolls with the page is carried by the page", async () => {
  const probe = await withPage("page", (view) =>
    acrossSyncScroll(view, "page-trigger", { from: 0, by: 120 }),
  );

  expect(probe.open).toBe(true);
  expect(probe.position).toBe("absolute");
  // Written in document coordinates and still next to its trigger, which is
  // what an unadded page scroll would break.
  expect(probe.attached).toBe(DISTANCE);
  // The browser moved the tip with the page: no frame, no correction, no drift.
  expect(probe.after).toBe(probe.before);
});

it("a tip on a viewport-anchored trigger stays in viewport coordinates", async () => {
  const probe = await withPage("fixed", (view) =>
    acrossSyncScroll(view, "fixed-trigger", { from: 200, by: 120 }),
  );

  expect(probe.open).toBe(true);
  expect(probe.position).toBe("fixed");
  expect(probe.attached).toBe(DISTANCE);
  // Neither moved, so the tip must not move either — document coordinates
  // would have carried it 120px away until the next frame.
  expect(probe.after).toBe(probe.before);
});

it("a tip inside a modal dialog stays attached while the page scrolls behind it", async () => {
  const probes = await withPage("modal", async (view) => {
    await view.evaluate(`(() => {
      window.scrollTo(0, 200);
      document.getElementById("open-dialog").click();
    })()`);
    await sleep(200);

    const read = async (id) => {
      await view.evaluate(`(() => {
        ${READERS}
        show(${JSON.stringify(id)});
      })()`);
      await sleep(300);
      return JSON.parse(
        await view.evaluate(`(() => {
          ${READERS}
          const trigger = document.getElementById(${JSON.stringify(id)});
          const tip = tipOf(trigger);
          const attached = attach(${JSON.stringify(id)});
          const before = gap(${JSON.stringify(id)});
          window.scrollBy(0, 150);
          return JSON.stringify({
            /* The generated tip belongs to the dialog subtree, or the modal's
               inertness would apply to it. */
            insideDialog: document.getElementById("dlg").contains(tip),
            position: getComputedStyle(tip).position,
            open: tip.matches(":popover-open"),
            scrolled: window.scrollY,
            attached,
            before,
            after: gap(${JSON.stringify(id)}),
          });
        })()`),
      );
    };

    return { explicit: await read("modal-trigger"), shorthand: await read("modal-shorthand") };
  });

  for (const probe of Object.values(probes)) {
    expect(probe.open).toBe(true);
    expect(probe.insideDialog).toBe(true);
    // The premise: a modal dialog does not stop the page from scrolling.
    expect(probe.scrolled).toBeGreaterThan(200);
    expect(probe.position).toBe("fixed");
    expect(probe.attached).toBe(DISTANCE);
    expect(probe.after).toBe(probe.before);
  }
});

/*
 * A tooltip must not change what the page can scroll to.
 *
 * This is the cost document coordinates carry and viewport ones do not: an
 * absolutely positioned box in the top layer joins the document's scrollable
 * overflow, so the scrollable height becomes the greater of the content's own
 * bottom and the tip's. A tip that overflows the content raises the scroll
 * maximum while it is up, and hiding it clamps back any position only that tip
 * made reachable — the page jumping upwards on every show and hide.
 *
 * What keeps it out of reach is placement: flip and shift put the tip inside
 * the viewport, which at any scroll position is inside the document. Measured
 * at the bottom of the page and across the demote/promote path, where the
 * margin for error is zero.
 */
it("a tooltip does not change what the page can scroll to", async () => {
  const reads = await withPage("overflow", async (view) => {
    const geometry = (at) =>
      view.evaluate(`(() => {
        const de = document.documentElement;
        return JSON.stringify({
          at: ${JSON.stringify(at)},
          scrollWidth: de.scrollWidth,
          scrollHeight: de.scrollHeight,
          maxScroll: de.scrollHeight - de.clientHeight,
          scrollY: Math.round(window.scrollY),
        });
      })()`);

    const out = [];
    await view.evaluate(`window.scrollTo(0, 1e6)`);
    await sleep(250);
    out.push(JSON.parse(await geometry("resting")));

    for (let cycle = 1; cycle <= 2; cycle++) {
      await view.evaluate(`(() => {
        ${READERS}
        show("low-trigger");
      })()`);
      await sleep(350);
      out.push(JSON.parse(await geometry(`shown ${cycle}`)));

      // Out of the boundary and back: the demote/promote path, which is where
      // a stale document coordinate would re-enter the top layer.
      await view.evaluate(`window.scrollTo(0, 0)`);
      await sleep(250);
      await view.evaluate(`window.scrollTo(0, 1e6)`);
      await sleep(250);
      out.push(JSON.parse(await geometry(`returned ${cycle}`)));

      await view.evaluate(`(() => {
        document.getElementById("low-trigger").dispatchEvent(new MouseEvent("mouseleave"));
      })()`);
      await sleep(350);
      out.push(JSON.parse(await geometry(`hidden ${cycle}`)));
    }
    return out;
  });

  const [resting] = reads;
  // Nothing the tooltip does may move any of these, at any point in the cycle.
  expect(resting.maxScroll).toBeGreaterThan(0);
  for (const read of reads) {
    expect(read).toEqual({ ...resting, at: read.at });
  }
});

/*
 * The touch-device report: focus a trigger, scroll it out of view, scroll back
 * — and the tooltip is gone for good. A second tap on an already-focused
 * trigger fires no focusin, so nothing reaches the runtime; the tip has to
 * come back from position tracking alone.
 */
it("a tip goes down when its trigger leaves the viewport and comes back with it", async () => {
  const states = await withPage("recovery", async (view) => {
    const openState = () =>
      view.evaluate(`(() => {
        const tip = document.getElementById(
          document.getElementById("low-trigger").getAttribute("aria-describedby"),
        );
        return String(!!tip && tip.matches(":popover-open"));
      })()`);

    await view.evaluate(`(() => {
      const trigger = document.getElementById("low-trigger");
      trigger.scrollIntoView({ block: "center" });
      trigger.focus();
    })()`);
    await sleep(400);
    const shown = await openState();

    await view.evaluate(`window.scrollTo(0, 0)`);
    await sleep(400);
    const scrolledAway = await openState();

    // No hover, no focus, no click: only the scroll back.
    await view.evaluate(
      `document.getElementById("low-trigger").scrollIntoView({ block: "center" })`,
    );
    await sleep(400);

    return { shown, scrolledAway, restored: await openState() };
  });

  expect(states.shown).toBe("true");
  expect(states.scrolledAway).toBe("false");
  expect(states.restored).toBe("true");
});
