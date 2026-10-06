/*
 * Real-browser .scroll-snap focus contract, driven over Bun.WebView.
 *
 * The rail scrolls on the inline axis, and `auto` on one axis computes the
 * other to `auto`, so the scrollport clips on all four sides. A focus ring on
 * the first, middle or last item is therefore clipped unless the rail reserves
 * the ring's own width — the same reason .steps-horizontal and the dialog body
 * already reserve it. Unlike .steps, .scroll-snap is generic: it cannot know a
 * button, a link card or several actions will land in it, so the reserve is
 * structural, not a `:has()` on the content.
 *
 * The reserve is paid for on the inside, and the two axes differ. On the block
 * axis a padding plus a negative margin returns the space to the flow, which
 * cannot grow the page. On the inline axis the reserve stays as the rail's
 * focus gutter: bleeding it outward would make the border box
 * `containing block + 2 * reserve` wide and push the page sideways when the
 * rail touches the viewport. A rail cannot be flush with arbitrary surrounding
 * content and free of page overflow at once, so it chooses the gutter.
 *
 * Four separate contracts, so accessibility never rides on a snapping detail:
 * the ring fits, the page does not overflow, edge items keep a real gutter, and
 * the scroll-padding clamp holds for a conforming zero.
 *
 * Dispatched Tab is the only honest way to reach the state: `.click()` would
 * not establish :focus-visible. The item is then scrolled against a clip edge
 * on purpose, because that is where a missing reserve shows.
 */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  fixtureUrl,
  setViewport,
  tabUntil,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/scroll-snap.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

/* Focus the item, park it against the clip edge it would meet, then read the
   distance from its ring to each scrollport edge; negative means clipped. */
const ringGeometry = (id) => `(() => {
  const el = document.getElementById(${JSON.stringify(id)});
  const rail = el.closest(".scroll-snap");
  if (${JSON.stringify(id)} === "first") rail.scrollLeft = 0;
  else if (${JSON.stringify(id)} === "last") rail.scrollLeft = rail.scrollWidth;
  else el.scrollIntoView({ inline: "center", block: "nearest" });
  const box = el.getBoundingClientRect();
  const clip = rail.getBoundingClientRect();
  const style = getComputedStyle(el);
  const ring = parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset);
  return {
    focused: document.activeElement === el,
    ring,
    inlineStart: box.left - ring - clip.left,
    inlineEnd: clip.right - box.right - ring,
    blockStart: box.top - ring - clip.top,
    blockEnd: clip.bottom - box.bottom - ring,
  };
})()`;

it("keeps the focus ring of a tabbed item inside the clip on all four sides", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await setViewport(view, { width: 320, height: 900 });
      for (const id of ["first", "middle", "last"]) {
        expect(
          await tabUntil(view, `document.activeElement?.id === ${JSON.stringify(id)}`),
          id,
        ).toBe(true);
        const result = await view.evaluate(ringGeometry(id));
        expect(result.focused, id).toBe(true);
        expect(result.ring, id).toBeGreaterThan(0);
        for (const edge of ["inlineStart", "inlineEnd", "blockStart", "blockEnd"]) {
          expect(result[edge], `${id} ${edge}: ${JSON.stringify(result)}`).toBeGreaterThanOrEqual(
            -0.5,
          );
        }
      }
    },
    { artifactName: "scroll-snap-focus" },
  );
});

/*
 * The inline reserve is the rail's focus gutter, not an alignment bug: at rest
 * at either end an item still clears the clip edge by the ring's width, and a
 * rail flush with the viewport does not push the page sideways.
 */
it("keeps a real inline focus gutter at both edges without growing the page", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await setViewport(view, { width: 320, height: 900 });
      const result = await view.evaluate(`(() => {
        const rail = document.getElementById("rail");
        const clip = rail.getBoundingClientRect();
        const root = getComputedStyle(document.documentElement);
        const reserve =
          parseFloat(root.getPropertyValue("--focus-ring-width")) +
          parseFloat(root.getPropertyValue("--focus-outline-offset"));
        rail.scrollLeft = 0;
        const first = document.getElementById("first").getBoundingClientRect();
        rail.scrollLeft = rail.scrollWidth;
        const last = document.getElementById("last").getBoundingClientRect();
        return {
          overflowY: getComputedStyle(rail).overflowY,
          reserve,
          firstGutter: first.left - clip.left,
          lastGutter: clip.right - last.right,
          pageOverflow: document.documentElement.scrollWidth - window.innerWidth,
        };
      })()`);
      // One scroll axis only: no phantom vertical scrollbar to protect against.
      expect(result.overflowY).toBe("hidden");
      // The gutter is exactly the ring's width at both ends.
      expect(result.firstGutter).toBe(result.reserve);
      expect(result.lastGutter).toBe(result.reserve);
      // A rail flush with the viewport must not push the page sideways.
      expect(result.pageOverflow).toBeLessThanOrEqual(0);
    },
    { artifactName: "scroll-snap-gutter" },
  );
});

/*
 * The clamp is not what protects the ring — padding-inline does. It only keeps
 * scroll and snap from parking a conforming <length> flush against the gutter.
 * `0px` is the value that exercises it; a unitless `0` drops the max() but
 * keeps the physical gutter, which is the documented degradation.
 */
it("clamps --scroll-snap-padding to the focus reserve", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const result = await view.evaluate(`(() => {
        const read = (id) => {
          const s = getComputedStyle(document.getElementById(id));
          return {
            start: parseFloat(s.scrollPaddingInlineStart),
            end: parseFloat(s.scrollPaddingInlineEnd),
          };
        };
        const root = getComputedStyle(document.documentElement);
        const ring =
          parseFloat(root.getPropertyValue("--focus-ring-width")) +
          parseFloat(root.getPropertyValue("--focus-outline-offset"));
        return { zero: read("zero"), wide: read("wide"), ring };
      })()`);
      // `0px` lands exactly on the ring's width.
      expect(result.zero.start).toBe(result.ring);
      expect(result.zero.end).toBe(result.ring);
      // A larger request still wins.
      expect(result.wide.start).toBeGreaterThanOrEqual(40);
    },
    { artifactName: "scroll-snap-clamp" },
  );
});
