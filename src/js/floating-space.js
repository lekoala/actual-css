/*
 * The coordinate space and CSS positioning scheme are one decision. Keeping
 * them in one value prevents a caller from writing document coordinates to a
 * fixed box, or viewport coordinates to an absolute one.
 *
 * An open top-layer element with position: absolute uses the initial
 * containing block, so only the anchor determines the correct mode.
 */
const VIEWPORT_ANCHORED = "dialog:modal, :popover-open";

function isViewportAnchored(anchor) {
  const win = anchor?.ownerDocument?.defaultView;
  if (!win) return true;

  // Modal dialogs and open popovers are viewport-anchored without computing
  // position: fixed, so the ancestor walk below cannot identify them.
  try {
    if (anchor.closest(VIEWPORT_ANCHORED)) return true;
  } catch {
    /* An engine without :modal / :popover-open: the walk is all there is. */
  }

  for (let el = anchor; el; el = el.parentElement) {
    const { position } = win.getComputedStyle(el);
    // Resolve sticky once even while unstuck: changing mode when it sticks
    // would jump the floating element between coordinate systems mid-scroll.
    if (position === "fixed" || position === "sticky") return true;
  }
  return false;
}

// Mirrors the placements @lekoala/floating accepts; it throws on any other
// value, and from an autoUpdate callback that throw would repeat on every
// scroll. Markup is validated here instead, so a typo warns once.
const PLACEMENTS = new Set(
  ["top", "bottom", "left", "right"].flatMap((side) => [side, `${side}-start`, `${side}-end`]),
);
const warnedPlacements = new WeakSet();

/**
 * The author's placement attribute, or null when absent or unknown.
 *
 * @param {Element | null | undefined} el
 * @param {string} attribute
 * @returns {string | null}
 */
export function readPlacement(el, attribute) {
  const value = el?.getAttribute(attribute);
  if (!value) return null;
  if (PLACEMENTS.has(value)) return value;
  if (!warnedPlacements.has(el)) {
    warnedPlacements.add(el);
    console.warn(`Unknown ${attribute}="${value}" ignored`, el);
  }
  return null;
}

/**
 * @param {Element | null | undefined} anchor
 * @returns {{ space: "viewport" | "document", position: "fixed" | "absolute" }}
 */
export function positionModeFor(anchor) {
  const space = isViewportAnchored(anchor) ? "viewport" : "document";
  return {
    space,
    position: space === "document" ? "absolute" : "fixed",
  };
}
