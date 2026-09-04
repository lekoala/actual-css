/*
 * Real-browser .list row region contract, driven over Bun.WebView.
 *
 * .list documents "optional leading and trailing regions", and a fixed
 * `auto minmax(0, 1fr) auto` grid could not deliver that: a row with no
 * leading region put its content in the leading track and handed the flexible
 * track to the trailing control, so a label took the row's free space and a
 * switch sat next to it instead of on the end edge. The row is flex, which is
 * what makes an absent region cost neither a track nor a gap — that is the
 * property under test here, measured rather than asserted from the source.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/list-item.html";
const TIMEOUT = 60_000;
const GAP = 16;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Every region's edges, rounded, relative to the viewport. */
const measure = (view) =>
  view.evaluate(`(() => {
    const box = (id) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width) };
    };
    return {
      row: box("all-three"),
      allThree: { leading: box("all-three-leading"), content: box("all-three-content"), trailing: box("all-three-trailing") },
      noLeading: { row: box("no-leading"), content: box("no-leading-content"), trailing: box("no-leading-trailing") },
      noTrailing: { row: box("no-trailing"), leading: box("no-trailing-leading"), content: box("no-trailing-content") },
      contentOnly: { row: box("content-only"), content: box("content-only-content") },
    };
  })()`);

it("a row places leading, content and trailing on their own edges", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await view.cdp("Emulation.setDeviceMetricsOverride", {
        width: 900,
        height: 900,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await sleep(150);

      const { row, allThree } = await measure(view);

      // Leading on the start edge, content one gap after it, trailing on the end.
      expect(allThree.leading.left).toBe(row.left);
      expect(allThree.content.left).toBe(allThree.leading.right + GAP);
      expect(allThree.trailing.right).toBe(row.right);

      // The content region takes the free space, not the trailing control.
      expect(allThree.content.right).toBe(allThree.trailing.left - GAP);
    },
    { artifactName: "list-item-three-regions" },
  );
});

it("a row with no leading region costs neither a track nor a gap", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await view.cdp("Emulation.setDeviceMetricsOverride", {
        width: 900,
        height: 900,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await sleep(150);

      const { noLeading } = await measure(view);

      // The content starts on the row's own start edge: no empty leading
      // track, and no gap standing in for one.
      expect(noLeading.content.left).toBe(noLeading.row.left);

      // The switch stays on the end edge and keeps its own width, so the
      // label and its description get everything else.
      expect(noLeading.trailing.right).toBe(noLeading.row.right);
      expect(noLeading.content.right).toBe(noLeading.trailing.left - GAP);
      expect(noLeading.content.width).toBe(noLeading.row.width - noLeading.trailing.width - GAP);
    },
    { artifactName: "list-item-no-leading" },
  );
});

it("a row with no trailing region lets its content reach the end edge", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await view.cdp("Emulation.setDeviceMetricsOverride", {
        width: 900,
        height: 900,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await sleep(150);

      const { noTrailing, contentOnly } = await measure(view);

      expect(noTrailing.leading.left).toBe(noTrailing.row.left);
      expect(noTrailing.content.left).toBe(noTrailing.leading.right + GAP);
      expect(noTrailing.content.right).toBe(noTrailing.row.right);

      // Content alone spans the whole row.
      expect(contentOnly.content.left).toBe(contentOnly.row.left);
      expect(contentOnly.content.right).toBe(contentOnly.row.right);
    },
    { artifactName: "list-item-no-trailing" },
  );
});
