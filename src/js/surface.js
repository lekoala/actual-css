import enhance from "./enhance.js";
import { EVENTS } from "./events.js";
import { autoUpdate, reposition, repositionAt } from "./floating.js";

import { CLASSES } from "./selectors.js";

const openSurfaces = new Set();
const surfaceMap = new WeakMap();
const surfaceRetainers = new WeakMap();
const mountedSurfaces = new WeakMap();
const clickBoundDocuments = new WeakSet();

const SURFACE_MARKER = "data-actual-surface";
const reapers = new WeakMap();

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

function shouldUseSheet(menu, state) {
  const mobile = state.mobile || "auto";
  if (mobile === "none" || mobile === "anchored") return false;
  if (mobile === "sheet") return true;

  const view = menu.ownerDocument?.defaultView;
  if (!view || typeof view.matchMedia !== "function") {
    return false;
  }

  const breakpoint = state.breakpoint ?? 768;
  return (
    view.matchMedia("(pointer: coarse)").matches &&
    view.matchMedia(`(max-width: ${breakpoint}px)`).matches
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
  state.isSheet = shouldUseSheet(menu, state);
  if (state.isSheet) {
    menu.style.removeProperty("left");
    menu.style.removeProperty("top");
  }
  menu.classList.toggle(CLASSES.sheet, state.isSheet);
  ensureBackdrop(menu, state);
}

function positionSurface(menu) {
  const state = surfaceMap.get(menu);
  if (!state || state.isSheet) return true;

  if (state.trigger) {
    const triggerWidth = state.trigger.getBoundingClientRect().width;
    menu.style.setProperty("--surface-anchor-width", `${triggerWidth}px`);
  } else {
    menu.style.removeProperty("--surface-anchor-width");
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
  const state = {
    stopTracking: null,
    unregisterEscape: null,
    backdrop: null,
    trigger: null,
    source: null,
    point: null,
    mobile: "auto",
    breakpoint: 768,
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
  return state;
}

// Escape and positional tracking belong to the *open* surface, not to the
// wiring. They start when the surface opens and stop when it closes, so a
// closed surface never participates in the dismissable stack or in
// scroll/resize work. Reopening re-registers in the correct order.
function startSurfaceResources(menu, state) {
  state.unregisterEscape = registerEscapeDismissal(menu, (opts) => closeSurface(menu, opts));
  state.stopTracking = autoUpdate(menu, () => {
    if (menu.hidden) return;
    // A point is expressed in viewport coordinates and remains valid while the
    // document scrolls. Dismissal is an interaction policy, not positioning.
    applyPresentation(menu, state);
    if (!positionSurface(menu)) closeSurface(menu);
  });
}

export function isSurfaceOpen(menu) {
  return menu.classList.contains(CLASSES.open) && !menu.hidden;
}

export function prepareSurface(menu) {
  if (!menu) return;
  menu.style.position = "fixed";
  menu.hidden = true;
  syncExpanded(menu, false);
  menu.setAttribute(SURFACE_MARKER, "");
  reaperFor(menu)?.refresh(menu);
}

export function retainSurface(panel) {
  if (!panel) return () => {};

  let entry = surfaceRetainers.get(panel);
  if (!entry) {
    prepareSurface(panel);
    entry = { count: 0 };
    surfaceRetainers.set(panel, entry);
  }
  entry.count++;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    entry.count--;
    if (entry.count <= 0) {
      disconnectSurface(panel, { restore: false });
      surfaceRetainers.delete(panel);
    }
  };
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
    if (other !== menu && other.ownerDocument === menu.ownerDocument) closeSurface(other);
  }

  const anchor = opts.trigger || opts.source || null;
  mountSurface(menu, anchor);
  prepareSurface(menu);
  const state = ensureSurfaceWired(menu);
  state.trigger = opts.trigger || null;
  state.source = opts.source || null;
  state.point =
    Number.isFinite(opts.x) && Number.isFinite(opts.y) ? { x: opts.x, y: opts.y } : null;
  state.mobile = opts.mobile || "auto";
  state.breakpoint = opts.breakpoint ?? 768;
  state.autoClose = String(opts.autoClose ?? "true");
  state.placement = opts.placement || "bottom-start";
  state.distance = opts.distance ?? 4;
  state.flip = opts.flip !== false;
  state.shift = opts.shift !== false;
  state.shiftPadding = opts.shiftPadding ?? 4;
  state.scope = opts.scope;
  state.restoreFocusTo = opts.restoreFocusTo || opts.trigger || opts.source || null;
  state.closeId++;

  menu.classList.add(CLASSES.open);
  menu.hidden = false;
  applyPresentation(menu, state);
  syncExpanded(menu, true);

  if (!positionSurface(menu)) {
    closeSurface(menu, { restoreFocus: false });
    return false;
  }

  openSurfaces.add(menu);
  startSurfaceResources(menu, state);
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
  state?.unregisterEscape?.();
  state?.stopTracking?.();

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
    surfaceMap.delete(menu);
  }
  restoreSurface(menu);
}

function onDocumentClick(e) {
  for (const menu of openSurfaces) {
    if (menu.ownerDocument !== e.currentTarget) continue;
    const state = surfaceMap.get(menu);
    if (!state || state.autoClose === "inside" || state.autoClose === "false") continue;
    if (menu.contains(e.target) || state?.trigger?.contains(e.target)) continue;
    closeSurface(menu);
  }
}

function ensureDocumentClick(menu) {
  const doc = menu.ownerDocument;
  if (!doc || clickBoundDocuments.has(doc)) return;
  clickBoundDocuments.add(doc);
  doc.addEventListener("click", onDocumentClick);
}

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
  const entry = stack.at(-1);
  if (!entry) return;

  event.preventDefault();
  entry.dismiss({ restoreFocus: true });
}

export function getSurfaceAutoClose(menu) {
  return surfaceMap.get(menu)?.autoClose ?? "true";
}
