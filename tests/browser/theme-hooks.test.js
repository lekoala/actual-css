/*
 * Hooks a theme sets to change component behaviour: --btn-shadow (a resting
 * elevation the solid hover overlay must compose with, not replace),
 * --finish, --shadow-control and --shadow-inset, and the accordion marker
 * glyph and open turn.
 */
import { expect } from "bun:test";
import { fixtureUrl, waitForBrowser } from "../../scripts/utils/browser.js";
import { browserSuite } from "./browser-suite.js";

const FIXTURE = "tests/browser/theme-hooks.html";

const { it, hoverSelector, tabUntil, withBrowserPage } = await browserSuite();

// Trap: the hover overlay is itself a box-shadow (inset 999px), so a theme
// elevation set on .btn vanished on hover until both shared one list.
it("keeps --btn-shadow under the solid hover overlay", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    await hoverSelector(view, "#btn-hover");
    await waitForBrowser(
      view,
      `getComputedStyle(document.getElementById("btn-hover")).boxShadow.includes("inset")`,
    );
    const shadow = await view.evaluate(`(() => ({
      rest: getComputedStyle(document.getElementById("btn-rest")).boxShadow,
      hover: getComputedStyle(document.getElementById("btn-hover")).boxShadow,
    }))()`);

    expect(shadow.rest).toBe("rgb(0, 0, 0) 4px 4px 0px 0px");
    expect(shadow.hover.startsWith("rgb(0, 0, 0) 4px 4px 0px 0px, ")).toBe(true);
    expect(shadow.hover).toContain("999px inset");
  });
});

// Trap: the focus rule reset box-shadow to none to drop any halo, which
// erased a theme's field elevation the moment the keyboard reached it.
it("keeps --control-shadow on a keyboard-focused field", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    await tabUntil(view, `document.activeElement?.id === "field"`);
    await waitForBrowser(view, `document.getElementById("field").matches(":focus-visible")`);
    const field = await view.evaluate(`(() => {
      const style = getComputedStyle(document.getElementById("field"));
      return { shadow: style.boxShadow, outline: style.outlineStyle };
    })()`);

    expect(field.outline).toBe("solid");
    expect(field.shadow).toBe("rgb(0, 0, 0) 3px 3px 0px 0px");
  });
});

// Trap: the hover rule used the background shorthand, which resets the image
// layer, so a finish set on .btn vanished under the pointer.
it("keeps --finish under the hover and off unfilled variants", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    await hoverSelector(view, "#finish-hover");
    await waitForBrowser(
      view,
      `getComputedStyle(document.getElementById("finish-hover")).boxShadow.includes("inset")`,
    );
    const image = await view.evaluate(`(() => ({
      hover: getComputedStyle(document.getElementById("finish-hover")).backgroundImage,
      outline: getComputedStyle(document.getElementById("finish-outline")).backgroundImage,
    }))()`);

    expect(image.hover).toStartWith("linear-gradient(");
    expect(image.outline).toBe("none");
  });
});

// One finish for every solid fill: a checked control or a solid pill beside
// a solid button must not read matte.
it("lights every solid fill with --finish and leaves the rest flat", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    const image = await view.evaluate(`Object.fromEntries(
      ["finish-switch", "finish-check", "finish-radio", "finish-badge", "relief-switch",
       "finish-unchecked", "finish-soft-badge"].map((id) => [
        id,
        getComputedStyle(document.getElementById(id)).backgroundImage.startsWith("linear-gradient("),
      ]),
    )`);

    expect(image).toEqual({
      "finish-switch": true,
      "finish-check": true,
      "finish-radio": true,
      "finish-badge": true,
      "relief-switch": false,
      "finish-unchecked": false,
      "finish-soft-badge": false,
    });
  });
});

it("recesses fields and rails with --shadow-inset, kept on keyboard focus", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    await tabUntil(view, `document.activeElement?.id === "relief-field"`);
    await waitForBrowser(view, `document.getElementById("relief-field").matches(":focus-visible")`);
    const shadows = await view.evaluate(`(() => Object.fromEntries(
      ["relief-field", "relief-switch", "relief-segmented", "relief-progress"].map((id) => [
        id,
        getComputedStyle(document.getElementById(id)).boxShadow,
      ]),
    ))()`);

    for (const shadow of Object.values(shadows)) {
      expect(shadow).toBe("rgb(0, 0, 0) 0px 2px 0px 0px inset");
    }
  });
});

// Trap: the selected segment's ring and its shadow share one list, so the
// control relief must be appended after the ring, never replace the list.
it("lifts moving parts with --shadow-control and falls back to --shadow", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    const shadows = await view.evaluate(`(() => ({
      knob: getComputedStyle(document.getElementById("relief-switch"), "::before").boxShadow,
      pill: getComputedStyle(document.querySelector("#relief-segmented .segment")).boxShadow,
      plain: getComputedStyle(document.querySelector("#plain-segmented .segment")).boxShadow,
    }))()`);

    expect(shadows.knob).toBe("rgb(0, 0, 0) 0px 1px 0px 0px");
    expect(shadows.pill).toEndWith(", rgb(0, 0, 0) 0px 1px 0px 0px");
    // Unset, the pill keeps the surface --shadow (its 12px ambient blur).
    expect(shadows.plain).toContain("12px");
  });
});

// Trap: a hook the component redeclares on itself never sees a container's
// value. These are fallback-only, so one ancestor restyles every instance;
// the disabled switch edge stays state-owned.
it("takes --check-radius, --switch-border and --progress-border from an ancestor", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    const styles = await view.evaluate(`(() => {
      const css = (id) => getComputedStyle(document.getElementById(id));
      const bar = (id) => ({ border: css(id).borderTopWidth + " " + css(id).borderTopColor, height: document.getElementById(id).offsetHeight });
      return {
        check: css("sketch-check").borderRadius,
        radio: css("sketch-radio").borderRadius,
        switchRest: css("sketch-switch").borderTopColor,
        switchOn: css("sketch-switch-on").borderTopColor,
        switchDisabled: css("sketch-switch-off").borderTopColor,
        plainRest: [css("plain-switch").borderTopColor, css("plain-switch").backgroundColor],
        plainOn: [css("plain-switch-on").borderTopColor, css("plain-switch-on").backgroundColor],
        progress: bar("sketch-progress"),
        plainProgress: css("relief-progress").borderTopWidth,
      };
    })()`);

    expect(styles.check).toBe("1px 5px 2px 4px");
    expect(styles.radio).not.toBe(styles.check);
    expect(styles.switchRest).toBe("rgb(0, 128, 0)");
    expect(styles.switchOn).toBe("rgb(0, 128, 0)");
    expect(styles.switchDisabled).not.toBe("rgb(0, 128, 0)");
    // Unset, the edge follows the track in every state.
    expect(styles.plainRest[0]).toBe(styles.plainRest[1]);
    expect(styles.plainOn[0]).toBe(styles.plainOn[1]);
    // The edge sits inside --bar-height: the bar keeps its thickness.
    expect(styles.progress).toEqual({ border: "2px rgb(0, 128, 0)", height: 16 });
    expect(styles.plainProgress).toBe("0px");
  });
});

// The radius hooks are fallback-only: unset, every component and variant keeps
// its own default; set on a region, they reach every instance and variant
// inside it, except .join.circle, whose explicit class wins; set locally, they
// win over the region.
it("takes every radius hook from an ancestor and keeps each default", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    const radii = await view.evaluate(`(() => {
      const radius = (el) => getComputedStyle(el).borderTopLeftRadius;
      const ref = (name) => radius(document.getElementById("ref-" + name));
      const read = (id) => {
        const part = (name) => document.querySelector("#" + id + " [data-part='" + name + "']");
        const segmented = part("segmented");
        return {
          card: radius(part("card")),
          badge: radius(part("badge")),
          btn: radius(part("btn")),
          link: radius(part("link")),
          segmented: radius(segmented),
          segment: parseFloat(radius(segmented.querySelector(".segment"))) + parseFloat(getComputedStyle(segmented).paddingTop) + "px",
          join: radius(part("join").firstElementChild),
          choiceCard: radius(part("choice-card")),
          chip: radius(part("chip")),
          circle: radius(part("circle").firstElementChild),
        };
      };
      return {
        ref: { radius: ref("radius"), sm: ref("radius-sm"), lg: ref("radius-lg"), full: ref("radius-full") },
        default: read("radius-default"),
        region: read("radius-region"),
        local: read("radius-local"),
      };
    })()`);
    const { ref } = radii;

    expect(radii.default).toEqual({
      card: ref.lg,
      badge: ref.full,
      btn: ref.radius,
      link: ref.sm,
      segmented: ref.radius,
      segment: ref.radius,
      join: ref.radius,
      choiceCard: ref.radius,
      chip: ref.full,
      circle: ref.full,
    });
    expect(radii.region).toEqual({
      card: "9px",
      badge: "3px",
      btn: "7px",
      link: "7px",
      segmented: "11px",
      segment: "11px",
      join: "5px",
      choiceCard: "13px",
      chip: "13px",
      circle: ref.full,
    });
    for (const part of [
      "card",
      "badge",
      "btn",
      "link",
      "segmented",
      "join",
      "choiceCard",
      "chip",
    ]) {
      expect(radii.local[part], part).toBe("1px");
    }
    expect(radii.local.circle).toBe(ref.full);
  });
});

it("turns the accordion marker by its hook and swaps its glyph", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    const marker = await view.evaluate(`(() => {
      const read = (selector) => {
        const style = getComputedStyle(document.querySelector(selector), "::after");
        return { transform: style.transform, mask: style.maskImage };
      };
      return {
        chevronOpen: read("#acc-default details[open] summary"),
        plusOpen: read("#acc-plus details[open] summary"),
        plusClosed: read("#acc-plus details:not([open]) summary"),
      };
    })()`);
    const angle = (matrix) => {
      const [a, b] = matrix.match(/-?[\d.e-]+/g).map(Number);
      return Math.round((Math.atan2(b, a) * 180) / Math.PI);
    };

    expect(Math.abs(angle(marker.chevronOpen.transform))).toBe(180);
    expect(angle(marker.plusOpen.transform)).toBe(45);
    expect(marker.plusClosed.transform).toBe("none");
    expect(marker.plusOpen.mask).not.toBe(marker.chevronOpen.mask);
    expect(marker.plusOpen.mask).toBe(marker.plusClosed.mask);
  });
});
