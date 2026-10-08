/*
 * Real-browser .app-nav contract, driven over Bun.WebView.
 *
 * Forced colors flatten --state-selected to the bar's Canvas, so the current
 * tile needs a structural cue that survives the user agent's palette. Trap: a
 * Highlight/HighlightText repaint looked right in computed style while
 * Chromium drew its Canvas backplate behind the label and HighlightText
 * vanished on it. The cue is a transparent border on a ::before overlay: forced
 * colors turn it into a system-color frame, while the overlay costs no layout
 * (an element border shrinks the content box and shifted the icon and label by
 * --border-width in the side layout). The tile must neither opt out of forced
 * colors nor change size for it.
 */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  fixtureUrl,
  setViewport,
  tabUntil,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/app-nav.html";
const SIDE_FIXTURE = "tests/browser/app-nav-side.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

const READ = `(() => {
  const read = (id) => {
    const el = document.getElementById(id);
    const cs = getComputedStyle(el);
    const cue = getComputedStyle(el, "::before");
    const rect = el.getBoundingClientRect();
    return {
      adjust: cs.forcedColorAdjust,
      borderStyle: cs.borderTopStyle,
      cueContent: cue.content,
      cueStyle: cue.borderTopStyle,
      cue: cue.borderTopColor,
      fill: cs.backgroundColor,
      ink: cs.color,
      width: rect.width,
      height: rect.height,
    };
  };
  return { current: read("current"), other: read("other") };
})()`;

it("the current tile's cue costs nothing outside forced colors", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const { current, other } = await view.evaluate(READ);
      // The cue lives on a pseudo overlay: the tile itself has no border, so
      // its content box is never narrowed.
      expect(current.borderStyle).toBe("none");
      expect(current.cueContent).toBe('""');
      expect(current.cueStyle).toBe("solid");
      expect(current.cue).toBe("rgba(0, 0, 0, 0)");
      expect(other.cueContent).toBe("none");
      // The cue does not resize the tile against its peers.
      expect(current.width).toBe(other.width);
      expect(current.height).toBe(other.height);
    },
    { artifactName: "app-nav" },
  );
});

it("forced colors frame the current tile without opting out", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const { current, other } = await view.evaluate(READ);
      // The user agent keeps the palette: no opt-out, no Highlight repaint.
      // Both tiles fill with Canvas; only the alpha the author gave survives.
      const rgb = (color) => color.match(/\d+/g).slice(0, 3).join(",");
      expect(current.adjust).toBe("auto");
      expect(rgb(current.fill)).toBe(rgb(other.fill));
      // The transparent border is now a visible system-color frame, and only
      // the current tile has one.
      expect(current.cueStyle).toBe("solid");
      expect(current.cue).not.toBe("rgba(0, 0, 0, 0)");
      expect(current.cue).not.toBe(current.fill);
      expect(other.cueStyle).toBe("none");
    },
    {
      artifactName: "app-nav-forced",
      mediaFeatures: [{ name: "forced-colors", value: "active" }],
    },
  );
});

// Computed styles prove the mechanism, not the pixels Chromium paints. This
// samples the rendered screenshot: the current tile's top edge carries the
// frame, the non-current tile's top edge matches its own interior.
it("forced colors paint the frame on the current tile only", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await setViewport(view, { width: 800, height: 600 });
      const geometry = await view.evaluate(`(() => {
        const rect = (id) => {
          const r = document.getElementById(id).getBoundingClientRect();
          return { x: r.x, y: r.y, w: r.width, h: r.height };
        };
        return { current: rect("current"), other: rect("other") };
      })()`);
      const shot = await view.cdp("Page.captureScreenshot", { format: "png" });
      const dataUrl = `data:image/png;base64,${shot.data}`;
      const painted = await view.evaluate(`(async () => {
        const img = new Image();
        img.src = ${JSON.stringify(dataUrl)};
        await img.decode();
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);
        const scale = img.width / window.innerWidth;
        const at = (x, y) => {
          const d = ctx.getImageData(Math.floor(x * scale), Math.floor(y * scale), 1, 1).data;
          return [d[0], d[1], d[2]].join(",");
        };
        const g = ${JSON.stringify(geometry)};
        const top = (r) => at(r.x + r.w / 2, r.y + 0.5);
        const inside = (r) => at(r.x + r.w / 2, r.y + 4);
        return {
          currentTop: top(g.current),
          currentInside: inside(g.current),
          otherTop: top(g.other),
          otherInside: inside(g.other),
        };
      })()`);
      expect(painted.currentTop).not.toBe(painted.otherTop);
      expect(painted.currentTop).not.toBe(painted.currentInside);
      expect(painted.otherTop).toBe(painted.otherInside);
    },
    {
      width: 800,
      height: 600,
      artifactName: "app-nav-forced-paint",
      mediaFeatures: [{ name: "forced-colors", value: "active" }],
    },
  );
});

// The side layout starts its content at the inline edge, where an element
// border used to push the icon and label by --border-width. The overlay keeps
// the content box intact, so current and non-current tiles stay aligned.
it("side navigation keeps the current tile's content aligned with its peers", async () => {
  await withBrowserPage(
    fixtureUrl(SIDE_FIXTURE),
    async (view) => {
      const boxes = await view.evaluate(`(() => {
        const rect = (id) => {
          const r = document.getElementById(id).getBoundingClientRect();
          return { x: r.x, w: r.width };
        };
        return {
          current: rect("current"),
          other: rect("other"),
          currentIcon: rect("current-icon"),
          otherIcon: rect("other-icon"),
          currentLabel: rect("current-label"),
          otherLabel: rect("other-label"),
        };
      })()`);
      expect(boxes.current.w).toBe(boxes.other.w);
      expect(boxes.currentIcon.x).toBe(boxes.otherIcon.x);
      expect(boxes.currentLabel.x).toBe(boxes.otherLabel.x);
    },
    { width: 1100, height: 900, artifactName: "app-nav-side" },
  );
});

// The cue is a border, the focus affordance an outline: making a tile current
// must not switch off its keyboard ring, nor must focus hide the current cue.
it("the current cue and the keyboard focus ring stay distinct", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      expect(await tabUntil(view, 'document.activeElement?.id === "current"')).toBe(true);
      const state = await view.evaluate(`(() => {
        const el = document.getElementById("current");
        const cs = getComputedStyle(el);
        const cue = getComputedStyle(el, "::before");
        return {
          outlineStyle: cs.outlineStyle,
          outlineWidth: cs.outlineWidth,
          cueStyle: cue.borderTopStyle,
          cue: cue.borderTopColor,
        };
      })()`);
      expect(state.outlineStyle).toBe("solid");
      expect(state.outlineWidth).toBe("2px");
      expect(state.cueStyle).toBe("solid");
      expect(state.cue).toBe("rgba(0, 0, 0, 0)");
    },
    { artifactName: "app-nav-focus" },
  );
});
