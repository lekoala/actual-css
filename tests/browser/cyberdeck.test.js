import { expect } from "bun:test";
import { fixtureUrl } from "../../scripts/utils/browser.js";
import { browserSuite } from "./browser-suite.js";

const { it, tabUntil, withBrowserPage } = await browserSuite();

const FIXTURE = "tests/browser/cyberdeck.html";

// The deck's geometry is corner-shape over the radius tokens. Both branches are
// a contract: a supporting engine bevels, any other stays square, and neither
// may lose the focus outline.
it("cyberdeck bevels with corner-shape and stays square without it", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    const geometry = await view.evaluate(`(() => {
      const style = (id, pseudo) => getComputedStyle(document.getElementById(id), pseudo ?? null);
      const card = document.getElementById("card-choice").closest(".choice-card");
      const corners = (s) => ["top-left", "top-right", "bottom-right", "bottom-left"]
        .map((corner) => s.getPropertyValue("corner-" + corner + "-shape"))
        .join(" ");
      return {
        supported: CSS.supports("corner-shape", "bevel"),
        btnRadius: style("btn").borderBottomRightRadius,
        btn: corners(style("btn")),
        frame: corners(getComputedStyle(card)),
        radio: corners(style("radio")),
        badge: corners(getComputedStyle(card, "::before")),
      };
    })()`);

    if (geometry.supported) {
      const bevel = "superellipse(0)";
      const square = "superellipse(infinity)";
      expect(geometry.btnRadius).not.toBe("0px");
      // Buttons and fields cut the bottom-right; frames cut two opposite
      // corners; anything drawn round is cut on all four, or a full radius
      // collapses into a diagonal sliver.
      expect(geometry.btn).toBe([square, square, bevel, square].join(" "));
      expect(geometry.frame).toBe([bevel, square, bevel, square].join(" "));
      expect(geometry.radio).toBe([bevel, bevel, bevel, bevel].join(" "));
      expect(geometry.badge).toBe([bevel, bevel, bevel, bevel].join(" "));
    } else {
      expect(geometry.btnRadius).toBe("0px");
      expect(geometry.radio).not.toContain("superellipse");
    }
  });
});

it("cyberdeck keeps the solid focus outline on a bevelled button", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    expect(await tabUntil(view, `document.activeElement?.id === "btn"`)).toBe(true);
    const outline = await view.evaluate(`(() => {
      const s = getComputedStyle(document.getElementById("btn"));
      return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) };
    })()`);
    expect(outline.style).toBe("solid");
    expect(outline.width).toBeGreaterThan(0);
  });
});

// The printed state sits inside the track; a longer word is the page's call
// through --switch-width, and must then fit beside the knob.
it("cyberdeck switch labels fit inside the track", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    const fits = await view.evaluate(`(() => {
      // Out of flow: body is a .stack, which would stretch the probe.
      const probe = document.createElement("span");
      probe.style.position = "absolute";
      document.body.append(probe);
      return ["switch", "switch-off", "switch-long"].map((id) => {
        const el = document.getElementById(id);
        const label = getComputedStyle(el, "::after");
        const knob = getComputedStyle(el, "::before");
        probe.style.font = label.font;
        probe.style.letterSpacing = label.letterSpacing;
        probe.textContent = label.content.match(/^"([^"]*)"/)?.[1] ?? "";
        // The track minus the knob and its two margins, minus the label's own
        // inset from the track edge.
        const inset = el.checked ? label.insetInlineStart : label.insetInlineEnd;
        const free = parseFloat(getComputedStyle(el).width) - parseFloat(knob.width) -
          2 * parseFloat(knob.insetInlineStart) - parseFloat(inset);
        return { id, text: probe.textContent, width: probe.getBoundingClientRect().width, free };
      });
    })()`);
    for (const { id, text, width, free } of fits) {
      expect(text.length).toBeGreaterThan(0);
      expect({ id, text, width, free, fits: width <= free }).toEqual({
        id,
        text,
        width,
        free,
        fits: true,
      });
    }
  });
});
