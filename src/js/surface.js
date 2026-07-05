import { track, reposition, repositionAt } from "./floating.js";
import { EVENTS } from "./events.js";
import { hasMenuItem, hasMenuItems, onMenuKeydown } from "./menu.js";

const DEFAULT_BREAKPOINT = 768;
const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
};
const openSurfaces = new Set();
const surfaceMap = new WeakMap();
const mountedSurfaces = new WeakMap();

function waitForAnimations(...elements) {
  const animations = elements
    .filter(Boolean)
    .flatMap((el) =>
      typeof el.getAnimations === "function" ? el.getAnimations({ subtree: true }) : [],
    );

  return Promise.allSettled(animations.map((animation) => animation.finished));
}

function getSurfaceRoot(menu, anchor) {
  return anchor?.closest("dialog") || menu.closest("dialog") || menu.ownerDocument.body;
}

function mountSurface(menu, anchor) {
  if (mountedSurfaces.has(menu)) return;

  const root = getSurfaceRoot(menu, anchor);
  const parent = menu.parentNode;
  if (!root || !parent || parent === root) return;

  mountedSurfaces.set(menu, { parent, next: menu.nextSibling });
  root.append(menu);
}

function restoreSurface(menu) {
  const mount = mountedSurfaces.get(menu);
  if (!mount) return;

  if (mount.parent.isConnected) {
    const next = mount.next?.parentNode === mount.parent ? mount.next : null;
    mount.parent.insertBefore(menu, next);
  } else {
    menu.remove();
  }

  mountedSurfaces.delete(menu);
}

function getBreakpoint(menu) {
  const value = menu.dataset.flyoutBreakpoint || "";
  const raw = Number.parseInt(BREAKPOINTS[value] || value, 10);
  return Number.isFinite(raw) ? raw : DEFAULT_BREAKPOINT;
}

function getMobileMode(menu, mode) {
  return mode || menu.dataset.flyoutMobile || "auto";
}

function getPlacement(menu, placement) {
  return placement || menu.dataset.flyoutPlacement || "bottom-start";
}

function getDistance(menu, distance) {
  if (distance != null) return distance;
  const value = Number.parseFloat(menu.dataset.flyoutDistance);
  return Number.isFinite(value) ? value : 4;
}

function getAutoCloseMode(menu, value) {
  const mode = String(value ?? menu.dataset.flyoutAutoClose ?? "true").toLowerCase();
  if (mode === "inside" || mode === "outside" || mode === "false") return mode;
  return "true";
}

function shouldUseSheet(menu, mode) {
  const mobile = getMobileMode(menu, mode);
  if (mobile === "none" || mobile === "anchored") return false;
  if (mobile === "sheet") return true;

  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  const breakpoint = getBreakpoint(menu);
  return (
    window.matchMedia("(pointer: coarse)").matches &&
    window.matchMedia(`(max-width: ${breakpoint}px)`).matches
  );
}

function linkedTriggers(menu) {
  if (!menu.id) return [];
  return [
    ...menu.ownerDocument.querySelectorAll(`[aria-controls="${CSS.escape(menu.id)}"]`),
  ];
}

function syncExpanded(menu, expanded) {
  for (const trigger of linkedTriggers(menu)) {
    trigger.setAttribute("aria-expanded", expanded ? "true" : "false");
  }
}

function ensureBackdrop(menu, state) {
  if (!state.isSheet) {
    state.backdrop?.remove();
    state.backdrop = null;
    return;
  }

  if (state.backdrop?.isConnected) {
    state.backdrop.hidden = false;
    return;
  }

  const backdrop = menu.ownerDocument.createElement("div");
  backdrop.className = "surface-backdrop";
  backdrop.hidden = false;
  backdrop.addEventListener("click", () => {
    closeSurface(menu);
  });

  menu.before(backdrop);
  state.backdrop = backdrop;
}

function applyPresentation(menu, state) {
  state.isSheet = shouldUseSheet(menu, state.mobile);
  if (state.isSheet) {
    menu.style.removeProperty("left");
    menu.style.removeProperty("top");
  }
  menu.classList.toggle("is-sheet", state.isSheet);
  ensureBackdrop(menu, state);
}

function positionSurface(menu) {
  const state = surfaceMap.get(menu);
  if (!state || state.isSheet) return;

  if (state.trigger) {
    const triggerWidth = state.trigger.getBoundingClientRect().width;
    menu.style.setProperty("--flyout-trigger-width", `${triggerWidth}px`);
  } else {
    menu.style.removeProperty("--flyout-trigger-width");
  }

  const opts = {
    placement: state.placement || "bottom-start",
    distance: state.distance ?? 4,
    flip: state.flip !== false,
    shift: state.shift !== false,
    shiftPadding: state.shiftPadding ?? 4,
    scope: state.scope,
  };

  if (state.point) {
    repositionAt(state.point.x, state.point.y, menu, opts);
    return;
  }

  const anchor = state.trigger || state.source;
  if (anchor) reposition(anchor, menu, opts);
}

function ensureSurfaceWired(menu) {
  if (surfaceMap.has(menu)) return surfaceMap.get(menu);

  const controller = new AbortController();
  const state = {
    controller,
    untrack: track(menu),
    backdrop: null,
    trigger: null,
    source: null,
    point: null,
    mobile: "auto",
    placement: "bottom-start",
    distance: 4,
    flip: true,
    shift: true,
    shiftPadding: 4,
    autoClose: "true",
    isSheet: false,
    closeId: 0,
  };

  menu.addEventListener(
    EVENTS.reposition,
    (e) => {
      if (menu.hidden) return;
      if (e.detail?.type === "scroll" && surfaceMap.get(menu)?.point) {
        closeSurface(menu);
        return;
      }
      const state = surfaceMap.get(menu);
      if (!state) return;
      applyPresentation(menu, state);
      positionSurface(menu);
    },
    { signal: controller.signal },
  );

  menu.addEventListener(
    EVENTS.hide,
    () => {
      if (!menu.hidden) closeSurface(menu, { restoreFocus: true });
    },
    { signal: controller.signal },
  );

  if (hasMenuItems(menu)) {
    menu.addEventListener(
      "keydown",
      (e) => onMenuKeydown(e, { close: (target) => closeSurface(target) }),
      { signal: controller.signal },
    );
  }

  menu.addEventListener(
    "click",
    (e) => {
      const state = surfaceMap.get(menu);
      if (!state || state.autoClose === "outside" || state.autoClose === "false") return;
      if (hasMenuItem(e.target)) closeSurface(menu);
    },
    { signal: controller.signal },
  );

  surfaceMap.set(menu, state);
  return state;
}

export function isSurfaceOpen(menu) {
  return menu.classList.contains("is-open") && !menu.hidden;
}

export function prepareSurface(menu, anchor) {
  if (!menu) return;
  mountSurface(menu, anchor);
  menu.style.position = "fixed";
  menu.hidden = true;
}

export function openSurface(menu, opts = {}) {
  if (!menu || !menu.isConnected) return;
  if (isSurfaceOpen(menu)) return;

  for (const other of openSurfaces) {
    if (other !== menu) closeSurface(other);
  }

  const anchor = opts.trigger || opts.source || null;
  prepareSurface(menu, anchor);
  const state = ensureSurfaceWired(menu);
  state.trigger = opts.trigger || null;
  state.source = opts.source || null;
  state.point =
    Number.isFinite(opts.x) && Number.isFinite(opts.y)
      ? { x: opts.x, y: opts.y }
      : null;
  state.mobile = getMobileMode(menu, opts.mobile);
  state.autoClose = getAutoCloseMode(menu, opts.autoClose);
  state.placement = getPlacement(menu, opts.placement);
  state.distance = getDistance(menu, opts.distance);
  state.flip = opts.flip !== false;
  state.shift = opts.shift !== false;
  state.shiftPadding = opts.shiftPadding ?? 4;
  state.scope = opts.scope;
  state.restoreFocusTo = opts.restoreFocusTo || opts.trigger || opts.source || null;
  state.closeId++;

  menu.classList.add("is-open");
  menu.hidden = false;
  openSurfaces.add(menu);
  applyPresentation(menu, state);
  syncExpanded(menu, true);
  positionSurface(menu);
}

export function closeSurface(menu, opts = {}) {
  if (!menu || !isSurfaceOpen(menu)) return;

  const state = surfaceMap.get(menu);
  const closeId = state ? ++state.closeId : 0;
  menu.classList.remove("is-open");
  menu.classList.remove("is-sheet");
  menu.hidden = true;
  const backdrop = state?.backdrop || null;
  if (backdrop) backdrop.hidden = true;
  openSurfaces.delete(menu);
  syncExpanded(menu, false);

  if (opts.restoreFocus && state?.restoreFocusTo?.isConnected) {
    state.restoreFocusTo.focus();
  }

  waitForAnimations(menu, backdrop).then(() => {
    if (!state || state.closeId !== closeId) return;
    backdrop?.remove();
    if (state.backdrop === backdrop) state.backdrop = null;
  });
}

export function disconnectSurface(menu) {
  if (!menu) return;
  closeSurface(menu);
  const state = surfaceMap.get(menu);
  if (state) {
    state.backdrop?.remove();
    state.untrack();
    state.controller.abort();
    surfaceMap.delete(menu);
  }
  restoreSurface(menu);
}

// Global outside-click listener runs at import time; keep SSR imports inert.
if (typeof document !== "undefined") {
  document.addEventListener("click", (e) => {
    for (const menu of openSurfaces) {
      const state = surfaceMap.get(menu);
      if (!state || state.autoClose === "inside" || state.autoClose === "false") continue;
      if (menu.contains(e.target) || state?.trigger?.contains(e.target)) continue;
      closeSurface(menu);
    }
  });
}
