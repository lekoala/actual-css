/*
 * Surface coordinate-space contracts that require real layout and top-layer
 * behavior. The window-scroll assertions measure in the same task as scroll,
 * before autoUpdate's next animation frame can hide a one-frame detachment.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/surface-coordinate-space.html";
const TIMEOUT = 60_000;
const DISTANCE = 4;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const withPage = (name, run) =>
  withBrowserPage(fixtureUrl(FIXTURE), run, {
    artifactName: `surface-coordinate-space-${name}`,
    mediaFeatures: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });

const READERS = `
  const panelOf = (id) => document.getElementById(
    document.getElementById(id).getAttribute("aria-controls")
  );
  const gap = (id) => {
    const trigger = document.getElementById(id).getBoundingClientRect();
    const panel = panelOf(id).getBoundingClientRect();
    return Math.round(
      panel.top >= trigger.bottom ? panel.top - trigger.bottom : trigger.top - panel.bottom
    );
  };
`;

async function acrossWindowScroll(view, id, { from, by }) {
  await view.evaluate(`(() => {
    window.scrollTo(0, ${from});
    document.getElementById(${JSON.stringify(id)}).click();
  })()`);
  await sleep(250);

  return JSON.parse(
    await view.evaluate(`(() => {
      ${READERS}
      const panel = panelOf(${JSON.stringify(id)});
      const before = gap(${JSON.stringify(id)});
      window.scrollBy(0, ${by});
      return JSON.stringify({
        open: panel.matches(":popover-open"),
        position: getComputedStyle(panel).position,
        before,
        after: gap(${JSON.stringify(id)}),
      });
    })()`),
  );
}

it("a document-anchored surface follows page scroll before autoUpdate runs", async () => {
  const probe = await withPage("page", (view) =>
    acrossWindowScroll(view, "page-trigger", { from: 0, by: 80 }),
  );

  expect(probe.open).toBe(true);
  expect(probe.position).toBe("absolute");
  expect(probe.before).toBe(DISTANCE);
  expect(probe.after).toBe(probe.before);
});

it("fixed and sticky anchors keep surfaces in viewport coordinates", async () => {
  for (const id of ["fixed-trigger", "sticky-trigger"]) {
    const probe = await withPage(id, (view) => acrossWindowScroll(view, id, { from: 200, by: 80 }));

    expect(probe.open).toBe(true);
    expect(probe.position).toBe("fixed");
    expect(probe.before).toBe(DISTANCE);
    expect(probe.after).toBe(probe.before);
  }
});

it("nested scrolling still relies on autoUpdate", async () => {
  const probes = await withPage("nested", async (view) => {
    await view.evaluate(`(() => {
      const scroller = document.getElementById("scroller");
      scroller.scrollTop = 40;
      document.getElementById("nested-trigger").click();
    })()`);
    await sleep(250);

    const immediate = JSON.parse(
      await view.evaluate(`(() => {
        ${READERS}
        const panel = panelOf("nested-trigger");
        const before = gap("nested-trigger");
        document.getElementById("scroller").scrollBy(0, 30);
        return JSON.stringify({
          position: getComputedStyle(panel).position,
          before,
          after: gap("nested-trigger"),
        });
      })()`),
    );
    await sleep(100);
    const settled = Number(
      await view.evaluate(`(() => { ${READERS} return gap("nested-trigger"); })()`),
    );
    return { immediate, settled };
  });

  expect(probes.immediate.position).toBe("absolute");
  expect(probes.immediate.before).toBe(DISTANCE);
  expect(probes.immediate.after).not.toBe(probes.immediate.before);
  expect(probes.settled).toBe(DISTANCE);
});

it("a document surface that fits adds no scrollable overflow", async () => {
  const states = await withPage("overflow", async (view) => {
    const read = (at) =>
      view.evaluate(`(() => {
        const root = document.documentElement;
        return JSON.stringify({
          at: ${JSON.stringify(at)},
          scrollWidth: root.scrollWidth,
          scrollHeight: root.scrollHeight,
          maxScroll: root.scrollHeight - root.clientHeight,
          scrollY: Math.round(window.scrollY),
        });
      })()`);

    await view.evaluate(`window.scrollTo(0, 1e6)`);
    await sleep(200);
    const resting = JSON.parse(await read("resting"));
    await view.evaluate(`document.getElementById("fit-trigger").click()`);
    await sleep(250);
    const open = JSON.parse(await read("open"));
    await view.evaluate(`document.getElementById("fit-trigger").click()`);
    await sleep(250);
    const closed = JSON.parse(await read("closed"));
    return [resting, open, closed];
  });

  const [resting] = states;
  expect(resting.maxScroll).toBeGreaterThan(0);
  for (const state of states) {
    expect(state).toEqual({ ...resting, at: state.at });
  }
});
