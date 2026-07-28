/*
 * Compact positioning engine for menus, tooltips, and popovers.
 *
 * Core math ported from Floating UI. autoUpdate() batches scroll, resize,
 * and element-resize callbacks per ownerDocument so each document owns its
 * own listener set — no global import-time side effects.
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
  if (align === "start") coords[mainAxis] -= commonAlign * (rtl && isVertical ? -1 : 1);
  if (align === "end") coords[mainAxis] += commonAlign * (rtl && isVertical ? -1 : 1);

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

function getInlineOverflow(coords, floating, minX, maxX) {
  return Math.max(minX - coords.x, 0) + Math.max(coords.x + floating.width - maxX, 0);
}

function toBoundary(rect) {
  return {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    right: rect.x + rect.width,
    bottom: rect.y + rect.height,
  };
}

const supportsDirSelector = typeof CSS !== "undefined" && CSS.supports("selector(:dir(rtl))");

function isRTL(el) {
  if (el.dir === "rtl") return true;
  if (el.dir === "ltr") return false;
  if (supportsDirSelector) return el.matches(":dir(rtl)");
  return el.ownerDocument?.dir === "rtl";
}

function getDocEl(doc) {
  return doc.documentElement;
}

function toNumber(value) {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : 0;
}

const STABLE_SCROLLBAR_MAX_WIDTH = 25;
const NARROW_INLINE_FLIP_FALLBACK = 128;

function getViewportBoundary(doc) {
  const win = doc.defaultView || window;
  const docEl = getDocEl(doc);
  const visualViewport = win.visualViewport;
  const x = visualViewport?.offsetLeft || 0;
  const y = visualViewport?.offsetTop || 0;
  let width = visualViewport?.width || docEl.clientWidth || win.innerWidth;
  const height = visualViewport?.height || docEl.clientHeight || win.innerHeight;

  const body = doc.body;
  if (body?.clientWidth > 0) {
    const bodyStyle = win.getComputedStyle?.(body);
    const bodyMargin =
      doc.compatMode === "CSS1Compat"
        ? toNumber(bodyStyle?.marginLeft) + toNumber(bodyStyle?.marginRight)
        : 0;
    const stableScrollbar = Math.abs(docEl.clientWidth - body.clientWidth - bodyMargin);
    if (stableScrollbar <= STABLE_SCROLLBAR_MAX_WIDTH) {
      width -= stableScrollbar;
    }
  }

  return toBoundary({ x, y, width, height });
}

function getBoundary(ref, opts) {
  if (!opts.scope) return getViewportBoundary(ref.ownerDocument);
  const rect = opts.scope.getBoundingClientRect();
  return toBoundary({
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
  });
}

function isOutsideBoundary(rect, boundary) {
  return (
    rect.right < boundary.x ||
    rect.left > boundary.right ||
    rect.bottom < boundary.y ||
    rect.top > boundary.bottom
  );
}

function getAvailableHeight(refRect, side, boundary, distance, padding) {
  if (side === "top") {
    return Math.max(0, refRect.top - boundary.y - distance - padding);
  }
  if (side === "bottom") {
    return Math.max(0, boundary.bottom - refRect.bottom - distance - padding);
  }
  return Math.max(0, boundary.height - padding * 2);
}

function isVisible(el) {
  if (el.hidden) return false;
  if (typeof el.checkVisibility === "function") return el.checkVisibility();
  return el.getClientRects().length > 0;
}

function getFloatingSize(float) {
  const rect = float.getBoundingClientRect();
  return {
    width: float.offsetWidth || rect.width,
    height: float.offsetHeight || rect.height,
  };
}

/* ── Per-document batched callbacks ────────────────────── */

const trackers = new WeakMap();

function createTracker(doc) {
  const win = doc.defaultView;
  const ResizeObserver = win?.ResizeObserver;

  const entries = new Map();
  let resizeObserver = null;
  let tick = false;
  const pendingTypes = new Set();

  function getResizeObserver() {
    if (resizeObserver || !ResizeObserver) return resizeObserver;

    resizeObserver = new ResizeObserver((entries, observer) => {
      for (const entry of entries) {
        observer.unobserve(entry.target);
        rafNotify("element-resize");
        win.requestAnimationFrame(() => {
          if (tracker.entries.has(entry.target)) observer.observe(entry.target);
        });
      }
    });
    return resizeObserver;
  }

  function rafNotify(type) {
    pendingTypes.add(type);
    if (!tick) {
      win.requestAnimationFrame(() => {
        const types = [...pendingTypes];
        pendingTypes.clear();
        for (const [element, cb] of entries) {
          if (element.isConnected) {
            for (const type of types) cb({ type });
          }
        }
        tick = false;
      });
    }
    tick = true;
  }

  doc.addEventListener("scroll", (e) => rafNotify(e.type), {
    passive: true,
    capture: true,
  });
  win.addEventListener("resize", () => rafNotify("resize"), { passive: true });

  const tracker = {
    entries,
    add(element, callback) {
      entries.set(element, callback);
      getResizeObserver()?.observe(element);
      return () => {
        entries.delete(element);
        resizeObserver?.unobserve(element);
      };
    },
  };

  return tracker;
}

function trackerFor(element) {
  const doc = element.ownerDocument;
  let tracker = trackers.get(doc);
  if (!tracker) {
    tracker = createTracker(doc);
    trackers.set(doc, tracker);
  }
  return tracker;
}

export function autoUpdate(element, callback) {
  return trackerFor(element).add(element, callback);
}

/* ── Positioning ──────────────────────────────────────── */

export function reposition(ref, float, opts = {}) {
  if (!isVisible(float)) return false;

  const placement = opts.placement || "bottom-start";
  const distance = opts.distance || 0;
  const flip = opts.flip !== false;
  const shift = opts.shift !== false;
  const shiftPad = opts.shiftPadding || 4;
  const rtl = isRTL(ref);

  const rects = ref.getClientRects();
  const refRect = placement.startsWith("bottom") ? rects[rects.length - 1] : rects[0];
  if (!refRect) return false;

  const boundary = getBoundary(ref, opts);
  if (isOutsideBoundary(refRect, boundary)) return false;

  const floatRect = getFloatingSize(float);
  const sx = boundary.x;
  const sy = boundary.y;
  const cw = boundary.right;
  const ch = boundary.bottom;

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

    if (
      axis === "y" &&
      (coords.x < sx || coords.x + floatRect.width > cw) &&
      boundary.width - floatRect.width < NARROW_INLINE_FLIP_FALLBACK
    ) {
      side = "top";
      axis = "x";
      current = align ? `${side}-${align}` : side;
      coords = computeCoords(refRect, floatRect, current, rtl);
      applyOffset(coords, side, distance, rtl);
    }
  }

  if (axis === "x" && shift && getAlignment(current)) {
    const minX = sx + shiftPad;
    const maxX = cw - shiftPad;
    const currentOverflow = getInlineOverflow(coords, floatRect, minX, maxX);

    if (currentOverflow > 0) {
      const nextAlign = getAlignment(current) === "end" ? "start" : "end";
      const candidatePlacement = `${side}-${nextAlign}`;
      const candidate = computeCoords(refRect, floatRect, candidatePlacement, rtl);
      applyOffset(candidate, side, distance, rtl);

      if (getInlineOverflow(candidate, floatRect, minX, maxX) < currentOverflow) {
        current = candidatePlacement;
        coords = candidate;
      }
    }
  }

  let p = 50;
  if (shift || floatRect.width > refRect.width) {
    const minX = sx + shiftPad;
    const maxX = cw - floatRect.width - shiftPad;

    if (coords.x < minX) {
      const total = minX - coords.x;
      coords.x = minX;
      p = 50 - (total / floatRect.width) * 100;
    } else if (coords.x > maxX) {
      const total = maxX - coords.x;
      coords.x = Math.max(sx, maxX);
      p = 50 + (total / floatRect.width) * 100;
    }
  }

  let py = 50;
  if (axis === "y" && (shift || floatRect.height > refRect.height)) {
    const minY = sy + shiftPad;
    const maxY = ch - floatRect.height - shiftPad;

    if (coords.y < minY) {
      const total = minY - coords.y;
      coords.y = minY;
      py = 50 - (total / floatRect.height) * 100;
    } else if (coords.y > maxY) {
      const total = maxY - coords.y;
      coords.y = Math.max(sy, maxY);
      py = 50 + (total / floatRect.height) * 100;
    }
  }

  const availableHeight = getAvailableHeight(refRect, side, boundary, distance, shiftPad);
  float.style.setProperty("--arrow-x", `${p}%`);
  float.style.setProperty("--arrow-y", `${py}%`);
  float.style.setProperty("--available-height", `${availableHeight}px`);
  float.dataset.placement = current;
  Object.assign(float.style, {
    left: `${coords.x}px`,
    top: `${coords.y}px`,
  });

  return true;
}

export function repositionAt(x, y, float, opts = {}) {
  const doc = float.ownerDocument;
  const docEl = doc.documentElement;
  const win = doc.defaultView || window;
  const direction = doc.dir || docEl?.dir || win.getComputedStyle?.(docEl).direction || "";
  const ref = {
    ownerDocument: doc,
    dir: direction,
    matches: (selector) => selector === ":dir(rtl)" && direction === "rtl",
    getClientRects: () => [
      {
        x,
        y,
        left: x,
        top: y,
        right: x,
        bottom: y,
        width: 0,
        height: 0,
      },
    ],
  };

  return reposition(ref, float, opts);
}
