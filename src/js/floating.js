/*
 * Compact positioning engine for dropdowns, tooltips, and popovers.
 *
 * Core math ported from Floating UI. Uses a single global scroll/resize
 * listener to reposition all registered floating elements via rAF.
 */

/* ── Placement parsing ────────────────────────────────── */

function getSide(p) {
  return p.split("-")[0];
}

function getAlignment(p) {
  return p.split("-")[1] || null;
}

function getMainAxis(p) {
  return ["top", "bottom"].includes(getSide(p)) ? "x" : "y";
}

function flipSide(s) {
  if (s === "top") return "bottom";
  if (s === "bottom") return "top";
  if (s === "left") return "right";
  if (s === "right") return "left";
}

/* ── Coordinate math ──────────────────────────────────── */

function computeCoords(reference, floating, placement, rtl) {
  const commonX = reference.x + reference.width / 2 - floating.width / 2;
  const commonY = reference.y + reference.height / 2 - floating.height / 2;
  const mainAxis = getMainAxis(placement);
  const commonAlign =
    reference[mainAxis === "x" ? "width" : "height"] / 2 -
    floating[mainAxis === "x" ? "width" : "height"] / 2;
  const side = getSide(placement);

  let coords;
  switch (side) {
    case "top":
      coords = { x: commonX, y: reference.y - floating.height };
      break;
    case "bottom":
      coords = { x: commonX, y: reference.y + reference.height };
      break;
    case "right":
      coords = { x: reference.x + reference.width, y: commonY };
      break;
    case "left":
      coords = { x: reference.x - floating.width, y: commonY };
      break;
    default:
      coords = { x: reference.x, y: reference.y };
  }

  const align = getAlignment(placement);
  const isVertical = mainAxis === "x";
  if (align === "start")
    coords[mainAxis] -= commonAlign * (rtl && isVertical ? -1 : 1);
  if (align === "end")
    coords[mainAxis] += commonAlign * (rtl && isVertical ? -1 : 1);

  return coords;
}

function applyOffset(coords, side, offset, rtl) {
  switch (side) {
    case "top":
      coords.y -= offset;
      break;
    case "bottom":
      coords.y += offset;
      break;
    case "left":
      coords.x += rtl ? offset : -offset;
      break;
    case "right":
      coords.x += rtl ? -offset : offset;
      break;
  }
}

const supportsDirSelector =
  typeof CSS !== "undefined" && CSS.supports("selector(:dir(rtl))");

function isRTL(el) {
  if (el.dir === "rtl") return true;
  if (el.dir === "ltr") return false;
  if (supportsDirSelector) return el.matches(":dir(rtl)");
  return document.dir === "rtl";
}

function getDocEl(doc) {
  return doc.documentElement;
}

/* ── Global scroll / resize tracking ──────────────────── */

const tracked = new Set();
let tick = false;

function notify(type) {
  for (const el of tracked) {
    el.dispatchEvent(new CustomEvent("floating:reposition", { bubbles: false }));
    if (type === "escape") {
      el.dispatchEvent(new CustomEvent("floating:hide", { bubbles: false }));
    }
  }
}

function rafNotify(e) {
  if (!tick) {
    requestAnimationFrame(() => {
      notify();
      tick = false;
    });
  }
  tick = true;
}

if (typeof document !== "undefined") {
  document.addEventListener("scroll", rafNotify, { passive: true, capture: true });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !e.ctrlKey && !e.altKey && !e.shiftKey) {
      notify("escape");
    }
  });
}
if (typeof window !== "undefined") {
  window.addEventListener("resize", rafNotify, { passive: true });
}

/* ── Public API ────────────────────────────────────────── */

/**
 * Register a floating element for auto-reposition on scroll/resize.
 * Returns a cleanup function that removes the element from tracking.
 */
export function track(el) {
  tracked.add(el);
  return () => tracked.delete(el);
}

/**
 * Compute and apply position for a floating element relative to a reference.
 *
 * @param {Element} ref
 * @param {HTMLElement} float
 * @param {object} [opts]
 * @param {string} [opts.placement]  default "bottom-start"
 * @param {number} [opts.distance]   px offset from reference
 * @param {boolean} [opts.flip]      flip if overflows viewport
 * @param {boolean} [opts.shift]     shift if overflows x-axis
 * @param {number} [opts.shiftPadding] px padding when shifting
 * @param {Element} [opts.scope]     constrain to a bounding element
 */
export function reposition(ref, float, opts = {}) {
  if (float.style.display === "none" || float.style.visibility === "hidden")
    return;

  const placement = opts.placement || "bottom-start";
  const distance = opts.distance || 0;
  const flip = opts.flip !== false;
  const shift = opts.shift !== false;
  const shiftPad = opts.shiftPadding || 4;
  const rtl = isRTL(ref);

  const rects = ref.getClientRects();
  const refRect =
    placement.startsWith("bottom") ? rects[rects.length - 1] : rects[0];
  if (!refRect) return;

  const floatRect = float.getBoundingClientRect();
  const doc = getDocEl(ref.ownerDocument);
  let cw = doc.clientWidth;
  let ch = doc.clientHeight;

  if (window.innerWidth - cw > 20) {
    cw = window.innerWidth;
    ch = window.innerHeight;
  }

  let sx = 0;
  let sy = 0;
  if (opts.scope) {
    const b = opts.scope.getBoundingClientRect();
    sx = b.x;
    sy = b.y;
    cw = b.x + b.width;
    ch = b.y + b.height;
  }

  let side = getSide(placement);
  const align = getAlignment(placement);
  let axis = getMainAxis(placement);
  let current = placement;
  let coords = computeCoords(refRect, floatRect, current, rtl);
  applyOffset(coords, side, distance, rtl);

  if (flip) {
    const cx = Math.ceil(coords.x);
    const cy = Math.ceil(coords.y);

    if (
      (axis === "x" && (cy < sy || cy + floatRect.height >= ch)) ||
      (axis === "y" && (cx < sx || cx + floatRect.width >= cw))
    ) {
      side = flipSide(side);
      current = align ? `${side}-${align}` : side;
      coords = computeCoords(refRect, floatRect, current, rtl);
      applyOffset(coords, side, distance, rtl);
    }

    // fall back to top if still overflowing on y axis
    if (
      axis === "y" &&
      coords.x + floatRect.width > cw &&
      doc.clientWidth - floatRect.width < 128
    ) {
      side = "top";
      axis = "x";
      current = align ? `${side}-${align}` : side;
      coords = computeCoords(refRect, floatRect, current, rtl);
      applyOffset(coords, side, distance, rtl);
    }
  }

  // shift on x axis
  let p = 50;
  if (shift || floatRect.width > refRect.width) {
    if (coords.x < sx) {
      const total = coords.x - sx + shiftPad;
      coords.x = sx - shiftPad;
      p = 50 + (total / floatRect.width) * 100;
    } else if (coords.x + floatRect.width > cw) {
      const total = cw - (coords.x + floatRect.width) - shiftPad;
      coords.x += total;
      if (coords.x < 0) coords.x = 0;
      p = 50 + (total / floatRect.width) * 100;
    }
  }

  float.style.setProperty("--arrow-x", `${p}%`);
  float.dataset.placement = current;
  Object.assign(float.style, {
    left: `${coords.x}px`,
    top: `${coords.y}px`,
  });
}
