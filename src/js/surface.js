import enhance from "./enhance.js";
import { EVENTS } from "./events.js";
import { autoUpdate, reposition, repositionAt } from "./floating.js";

import { CLASSES } from "./selectors.js";

const DEFAULT_BREAKPOINT = 768;
const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
};
const openSurfaces = new Set();
const surfaceMap = new WeakMap();
const mountedSurfaces = new WeakMap();
const clickBoundDocuments = new WeakSet();

// data-actual-surface is written by the runtime, never by an author, and never
// selected on by CSS. It is namespaced because "data-surface" is a name an
// application may already own. surface.js reaps its own surfaces so consumers
// do not have to maintain panel-side lifecycle hooks.
const SURFACE_MARKER = "data-actual-surface";
const reapers = new WeakMap();

// Registered lazily, per owning document, and never at import time: enhance()
// binds its observer to the root it is given, so a module-scope
// enhance() would watch whichever document existed when this module was first
// imported. Surfaces in any other document (an iframe, or a fresh test
// document) would then never be swept. Keyed by Document, so nothing is
// retained once a document is gone.
function reaperFor(menu) {
  const root = menu.ownerDocument?.documentElement;
  if (!root) return null;

  let reaper = reapers.get(root);
  if (!reaper) {
    reaper = enhance(
      { [`[${SURFACE_MARKER}]`]: (el) => () => disconnectSurface(el, { restore: false }) },
      root,
    );
    reapers.set(root, reaper);
  }
  return reaper;
}

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
  return [...menu.ownerDocument.querySelectorAll(`[aria-controls="${CSS.escape(menu.id)}"]`)];
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
  backdrop.className = CLASSES.backdrop;
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
  menu.classList.toggle(CLASSES.sheet, state.isSheet);
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
    return repositionAt(state.point.x, state.point.y, menu, opts);
  }

  const anchor = state.trigger || state.source;
  if (anchor) return reposition(anchor, menu, opts);
  return true;
}

function ensureSurfaceWired(menu) {
  if (surfaceMap.has(menu)) return surfaceMap.get(menu);

  ensureDocumentClick(menu);
  const controller = new AbortController();
  const state = {
    controller,
    stopTracking: autoUpdate(menu, ({ type }) => {
      if (menu.hidden) return;
      if (type === "scroll" && surfaceMap.get(menu)?.point) {
        closeSurface(menu);
        return;
      }
      const current = surfaceMap.get(menu);
      if (!current) return;
      applyPresentation(menu, current);
      if (!positionSurface(menu)) closeSurface(menu);
    }),
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

  surfaceMap.set(menu, state);
  ensureDocumentEscape(menu);
  return state;
}

export function isSurfaceOpen(menu) {
  return menu.classList.contains(CLASSES.open) && !menu.hidden;
}

export function prepareSurface(menu) {
  if (!menu) return;
  menu.style.position = "fixed";
  menu.hidden = true;
  syncExpanded(menu, false);
  // Both steps are idempotent, so they run unguarded: that also keeps the
  // reaper correct if a surface is ever adopted into another document.
  menu.setAttribute(SURFACE_MARKER, "");
  reaperFor(menu)?.refresh(menu);
}

export function openSurface(menu, opts = {}) {
  if (!menu?.isConnected) return false;
  if (isSurfaceOpen(menu)) return false;

  const beforeOpen = new CustomEvent(EVENTS.surfaceOpen, {
    bubbles: true,
    cancelable: true,
    detail: { surface: menu, options: opts },
  });
  if (!menu.dispatchEvent(beforeOpen)) return false;

  for (const other of openSurfaces) {
    if (other !== menu) closeSurface(other);
  }

  const anchor = opts.trigger || opts.source || null;
  mountSurface(menu, anchor);
  prepareSurface(menu);
  const state = ensureSurfaceWired(menu);
  state.trigger = opts.trigger || null;
  state.source = opts.source || null;
  state.point =
    Number.isFinite(opts.x) && Number.isFinite(opts.y) ? { x: opts.x, y: opts.y } : null;
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

  menu.classList.add(CLASSES.open);
  menu.hidden = false;
  openSurfaces.add(menu);
  applyPresentation(menu, state);
  syncExpanded(menu, true);
  positionSurface(menu);
  return true;
}

export function closeSurface(menu, opts = {}) {
  if (!menu || !isSurfaceOpen(menu)) return;

  const state = surfaceMap.get(menu);
  const closeId = state ? ++state.closeId : 0;
  const wasSheet = state?.isSheet === true;
  const activeElement = menu.ownerDocument.activeElement;
  const shouldRestoreFocus = opts.restoreFocus ?? menu.contains(activeElement);
  menu.classList.remove(CLASSES.open);
  if (!wasSheet) {
    menu.classList.remove(CLASSES.sheet);
  }
  menu.hidden = true;
  const backdrop = state?.backdrop || null;
  if (backdrop) backdrop.hidden = true;
  openSurfaces.delete(menu);
  syncExpanded(menu, false);

  if (shouldRestoreFocus && state?.restoreFocusTo?.isConnected) {
    state.restoreFocusTo.focus({ preventScroll: true });
  }

  waitForAnimations(menu, backdrop).then(() => {
    if (!state || state.closeId !== closeId) return;
    state.isSheet = false;
    menu.classList.remove(CLASSES.sheet);
    backdrop?.remove();
    if (state.backdrop === backdrop) state.backdrop = null;
    restoreSurface(menu);
  });
}

export function disconnectSurface(menu, { restore = true } = {}) {
  if (!menu) return;
  if (!restore) mountedSurfaces.delete(menu);
  closeSurface(menu);
  const state = surfaceMap.get(menu);
  if (state) {
    state.backdrop?.remove();
    state.unregisterEscape?.();
    state.stopTracking?.();
    state.controller.abort();
    surfaceMap.delete(menu);
  }
  restoreSurface(menu);
}

function onDocumentClick(e) {
  for (const menu of openSurfaces) {
    const state = surfaceMap.get(menu);
    if (!state || state.autoClose === "inside" || state.autoClose === "false") continue;
    if (menu.contains(e.target) || state?.trigger?.contains(e.target)) continue;
    closeSurface(menu);
  }
}

// Bound per owning document on first use, not at import time — same reason as
// reaperFor(): an import-time listener attaches to whichever document existed
// then, and stays attached to it. Nothing can need this listener before a
// surface has been wired, so binding here costs nothing and keeps SSR imports
// inert without a typeof guard.
function ensureDocumentClick(menu) {
  const doc = menu.ownerDocument;
  if (!doc || clickBoundDocuments.has(doc)) return;
  clickBoundDocuments.add(doc);
  doc.addEventListener("click", onDocumentClick);
}

// Escape dismissal stack, per document. Tooltips pushed after flyouts
// naturally sit at the top: the most recently opened overlay dismisses first.
const dismissableStacks = new WeakMap();

export function registerEscapeDismissal(element, dismiss) {
  const doc = element.ownerDocument;
  let stack = dismissableStacks.get(doc);
  if (!stack) {
    stack = [];
    dismissableStacks.set(doc, stack);
    doc.addEventListener("keydown", onDocumentEscape);
  }

  const entry = { element, dismiss };
  stack.push(entry);

  return () => {
    const index = stack.indexOf(entry);
    if (index >= 0) stack.splice(index, 1);
  };
}

function onDocumentEscape(event) {
  if (event.key !== "Escape" || event.ctrlKey || event.altKey || event.shiftKey) return;

  const stack = dismissableStacks.get(event.currentTarget);
  const entry = stack?.at(-1);
  if (!entry) return;

  event.preventDefault();
  entry.dismiss({ restoreFocus: true });
}

function ensureDocumentEscape(menu) {
  if (!surfaceMap.has(menu)) return;

  const state = surfaceMap.get(menu);
  state.unregisterEscape = registerEscapeDismissal(menu, (opts) => closeSurface(menu, opts));
}
