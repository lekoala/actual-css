import { autoUpdate, reposition, repositionAt } from "@lekoala/floating";
import enhance from "./enhance.js";
import { registerEscapeDismissal } from "./escape.js";
import { EVENTS } from "./events.js";

import { CLASSES } from "./selectors.js";
import { waitForTransitions } from "./transition.js";

const openSurfaces = new Set();
const surfaceMap = new WeakMap();
const surfaceRetainers = new WeakMap();
const clickBoundDocuments = new WeakSet();

const SURFACE_MARKER = "data-actual-surface";
const AUTO_CLOSE_VALUES = new Set(["true", "inside", "outside", "false"]);
const SCROLL_KEYS = new Set([
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "End",
  "Home",
  "PageDown",
  "PageUp",
  " ",
]);
const reapers = new WeakMap();

function normalizeAutoClose(value) {
  const normalized = String(value ?? "outside");
  return AUTO_CLOSE_VALUES.has(normalized) ? normalized : "true";
}

function reaperFor(menu) {
  const root = menu.ownerDocument?.documentElement;
  if (!root) return null;

  let reaper = reapers.get(root);
  if (!reaper) {
    reaper = enhance({ [`[${SURFACE_MARKER}]`]: (el) => () => disconnectSurface(el) }, root);
    reapers.set(root, reaper);
  }
  return reaper;
}

/*
 * Transport: the top layer, via popover="manual".
 *
 * The runtime owns the whole lifecycle, so "manual" is the only usable mode —
 * it supplies promotion to the top layer and nothing else, leaving the
 * dismissal policy, Escape ordering and focus restoration below untouched.
 *
 * The attribute is set by the runtime, not asked of the author: a surface is
 * still marked up exactly as before. showPopover/hidePopover throw on an
 * out-of-order call (already open, not connected), which is a state Actual's
 * own guards should already have excluded — the try/catch is there so a
 * surprising DOM does not take the lifecycle down with it.
 */
function showTransport(menu) {
  try {
    menu.showPopover();
    return true;
  } catch {
    return false;
  }
}

function hideTransport(menu) {
  try {
    menu.hidePopover();
  } catch {
    /* Already closed or detached; nothing left to hide. */
  }
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

/*
 * Trigger state sync stays Actual's job, deliberately.
 *
 * A button carrying popovertarget gets an implicit invoker relation and the
 * platform computes aria-expanded on it by itself — measured on the AX tree:
 * expanded false when closed, true when open. Tempting, and out of scope: the
 * public contract here is aria-controls, and popovertarget would replace it.
 * That is a markup change for adopters, not an internal transport detail, so it
 * cannot ride along with a transport swap that changes no HTML.
 *
 * It is also not obviously a win. linkedTriggers() is small, explicit, and
 * already supports several triggers pointing at one panel; popovertarget covers
 * the single-invoker case. Any future move needs to weigh what is lost, not
 * just count the lines saved.
 */
function linkedTriggers(menu) {
  if (!menu.id) return [];
  return [...menu.ownerDocument.querySelectorAll(`[aria-controls="${CSS.escape(menu.id)}"]`)];
}

function syncExpanded(menu, expanded) {
  for (const trigger of linkedTriggers(menu)) {
    trigger.setAttribute("aria-expanded", expanded ? "true" : "false");
  }
}

/*
 * Where a runtime-created scrim goes. The panel itself is promoted, not moved,
 * so this is the one remaining need for a document-level root: a plain fixed
 * div cannot escape an ancestor's overflow or stacking context on its own.
 */
function backdropRoot(menu, anchor) {
  return anchor?.closest("dialog") || menu.closest("dialog") || menu.ownerDocument.body;
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

  // Not menu.before(): the panel stays where it was authored now, and a scrim
  // next to it there could not cover the viewport. The native ::backdrop is
  // not an option — its UA pointer-events: none is not overridable, even with
  // !important, so it would let clicks through to the page behind the sheet.
  backdropRoot(menu, state.trigger || state.source).append(backdrop);
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
    stopScrollIntent: null,
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
    autoClose: "outside",
    dismissOnScroll: false,
    scrollIntentAt: null,
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
  if (state.dismissOnScroll) {
    const controller = new AbortController();
    const arm = (event) => {
      state.scrollIntentAt = event.timeStamp;
    };
    const armExternalPointer = (event) => {
      if (!menu.contains(event.target)) arm(event);
    };
    const armKey = (event) => {
      if (!event.defaultPrevented && SCROLL_KEYS.has(event.key)) arm(event);
    };
    const dismissOnScroll = (event) => {
      if (state.scrollIntentAt == null || menu.contains(event.target)) return;
      closeSurface(menu);
    };
    const captureOptions = { signal: controller.signal, capture: true };
    const passiveCaptureOptions = { ...captureOptions, passive: true };
    const doc = menu.ownerDocument;
    doc.addEventListener("pointerdown", armExternalPointer, passiveCaptureOptions);
    doc.addEventListener("touchmove", arm, passiveCaptureOptions);
    doc.addEventListener("wheel", arm, passiveCaptureOptions);
    doc.addEventListener("keydown", armKey, { signal: controller.signal });
    doc.addEventListener("scroll", dismissOnScroll, passiveCaptureOptions);
    state.stopScrollIntent = () => controller.abort();
  }
  const anchor = state.point ? null : state.trigger || state.source;
  state.stopTracking = autoUpdate(anchor, menu, ({ type }) => {
    if (!isSurfaceOpen(menu)) return;
    if (type === "scroll" && state.dismissOnScroll) return;
    applyPresentation(menu, state);
    if (!positionSurface(menu)) closeSurface(menu);
  });
}

export function isSurfaceOpen(menu) {
  return menu.classList.contains(CLASSES.open);
}

export function prepareSurface(menu) {
  if (!menu) return;
  menu.style.position = "fixed";
  // A closed popover is hidden by the platform, so [hidden] is no longer the
  // closed state. Any left over from author markup would outrank it.
  menu.removeAttribute("hidden");
  // "manual" is written even over an author's own value, because it is the
  // whole of what the transport asks for. Any other mode hands the UA a
  // dismissal policy of its own: light dismiss closes on outside clicks only,
  // which silently defeats data-flyout-auto-close.
  menu.setAttribute("popover", "manual");
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
      // A released retainer may leave a mounted panel whose original parent
      // either still needs it back or has disappeared along with the trigger.
      disconnectSurface(panel);
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

  prepareSurface(menu);
  const state = ensureSurfaceWired(menu);
  state.trigger = opts.trigger || null;
  state.source = opts.source || null;
  state.point =
    Number.isFinite(opts.x) && Number.isFinite(opts.y) ? { x: opts.x, y: opts.y } : null;
  state.mobile = opts.mobile || "auto";
  state.breakpoint = opts.breakpoint ?? 768;
  state.autoClose = normalizeAutoClose(opts.autoClose);
  state.dismissOnScroll = opts.dismissOnScroll === true;
  state.scrollIntentAt = null;
  state.placement = opts.placement || "bottom-start";
  state.distance = opts.distance ?? 4;
  state.flip = opts.flip !== false;
  state.shift = opts.shift !== false;
  state.shiftPadding = opts.shiftPadding ?? 4;
  state.scope = opts.scope;
  state.restoreFocusTo = opts.restoreFocusTo || opts.trigger || opts.source || null;
  state.closeId++;

  // Promote before measuring: a closed popover has no box to position.
  if (!showTransport(menu)) return false;
  menu.classList.add(CLASSES.open);
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
  hideTransport(menu);
  const backdrop = state?.backdrop || null;
  if (backdrop) backdrop.hidden = true;
  openSurfaces.delete(menu);
  syncExpanded(menu, false);
  state?.unregisterEscape?.();
  state?.stopScrollIntent?.();
  state?.stopTracking?.();

  if (shouldRestoreFocus && state?.restoreFocusTo?.isConnected) {
    state.restoreFocusTo.focus({ preventScroll: true });
  }

  waitForTransitions(menu, backdrop).then(() => {
    if (!state || state.closeId !== closeId) return;
    state.isSheet = false;
    menu.classList.remove(CLASSES.sheet);
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
    state.unregisterEscape?.();
    state.stopScrollIntent?.();
    state.stopTracking?.();
    surfaceMap.delete(menu);
  }
}

function onDocumentClick(e) {
  const path = e.composedPath();

  for (const menu of openSurfaces) {
    if (menu.ownerDocument !== e.currentTarget) continue;
    const state = surfaceMap.get(menu);
    if (!state) continue;

    const menuIndex = path.indexOf(menu);
    const isInside = menuIndex >= 0;
    const hasCloseTrigger =
      isInside &&
      path
        .slice(0, menuIndex)
        .some((node) => node instanceof Element && node.hasAttribute("data-flyout-close"));

    if (hasCloseTrigger) {
      closeSurface(menu);
      continue;
    }

    const closesInside = state.autoClose === "true" || state.autoClose === "inside";
    const closesOutside = state.autoClose === "true" || state.autoClose === "outside";
    if ((isInside && closesInside) || (!isInside && closesOutside)) closeSurface(menu);
  }
}

function ensureDocumentClick(menu) {
  const doc = menu.ownerDocument;
  if (!doc || clickBoundDocuments.has(doc)) return;
  clickBoundDocuments.add(doc);
  doc.addEventListener("click", onDocumentClick);
}

export function getSurfaceAutoClose(menu) {
  return surfaceMap.get(menu)?.autoClose ?? "outside";
}
