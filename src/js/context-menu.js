import enhance from "./enhance.js";
import { focusFirstMenuItem, hasMenuItems } from "./menu.js";
import {
  closeSurface,
  disconnectSurface,
  isSurfaceOpen,
  openSurface,
  prepareSurface,
} from "./surface.js";

const LONG_PRESS_MS = 450;
const MOVE_TOLERANCE = 10;
const contextMap = new WeakMap();

function menuFor(target) {
  const id = target.getAttribute("data-context-menu");
  return id ? target.ownerDocument.getElementById(id) : null;
}

function shouldIgnoreNativeTarget(target) {
  return !!target.closest?.(
    "a, button, input, textarea, select, option, [contenteditable], [role='button'], [role='link'], [data-context-menu-ignore]",
  );
}

function getContextScope(target) {
  if (!target.hasAttribute("data-context-menu-scope")) return null;

  const value = target.getAttribute("data-context-menu-scope").trim();
  if (!value || value === "self") return target;
  if (value === "parent") return target.parentElement;

  try {
    return target.closest(value) || target.ownerDocument.querySelector(value);
  } catch {
    return null;
  }
}

function getLongPressDelay(target, menu) {
  const value = target.dataset.contextMenuLongPress ?? menu.dataset.contextMenuLongPress;
  if (value == null || value === "false" || value === "none") return null;
  if (value === "") return LONG_PRESS_MS;

  const delay = Number.parseInt(value, 10);
  return Number.isFinite(delay) ? delay : LONG_PRESS_MS;
}

function focusMenuContainer(menu) {
  if (!menu.hasAttribute("tabindex")) {
    menu.tabIndex = -1;
  }
  menu.focus();
}

// Pointer-triggered opens (right-click, long-press) focus the menu container,
// not the first item: a pointer-set focus ring is invisible (:focus-visible
// doesn't match), so focusing "Open" makes the first ArrowDown look like it
// skips to the second item. Focusing the container keeps the ring hidden and
// lets keys.js's out-of-list fallback (indexOf === -1) land ArrowDown/ArrowUp
// on the first/last item, matching native OS context menus. Keyboard-triggered
// opens (openFromKeyboard) still focus the first item directly.
function focusMenu(menu, mode) {
  if (!hasMenuItems(menu)) return;
  if (mode === "first-item") {
    focusFirstMenuItem(menu);
  } else {
    focusMenuContainer(menu);
  }
}

function openContextMenu(target, menu, opts = {}) {
  if (isSurfaceOpen(menu)) closeSurface(menu);
  openSurface(menu, {
    source: target,
    x: opts.x,
    y: opts.y,
    placement: opts.placement || "bottom-start",
    distance: opts.distance ?? 2,
    mobile: opts.mobile || menu.dataset.flyoutMobile || "auto",
    scope: opts.scope || getContextScope(target),
  });
  focusMenu(menu, opts.focus);
}

function openFromKeyboard(target, menu) {
  const rect = target.getBoundingClientRect();
  openContextMenu(target, menu, {
    x: rect.left,
    y: rect.bottom,
    placement: "bottom-start",
    distance: 4,
    focus: "first-item",
  });
}

function clearLongPress(state) {
  if (state.timer) {
    clearTimeout(state.timer);
    state.timer = null;
  }
  state.pointerId = null;
}

function connectContextTarget(target) {
  if (contextMap.has(target)) return;
  const menu = menuFor(target);
  if (!menu) return;

  prepareSurface(menu);
  const controller = new AbortController();
  const addedAriaControls = !target.hasAttribute("aria-controls");
  const addedAriaHaspopup = !target.hasAttribute("aria-haspopup");
  const addedAriaExpanded = !target.hasAttribute("aria-expanded");
  const state = {
    controller,
    addedAriaControls,
    addedAriaHaspopup,
    addedAriaExpanded,
    timer: null,
    pointerId: null,
    startX: 0,
    startY: 0,
    suppressClickUntil: 0,
  };

  if (addedAriaControls) target.setAttribute("aria-controls", menu.id);
  if (addedAriaHaspopup) target.setAttribute("aria-haspopup", "menu");
  if (addedAriaExpanded) target.setAttribute("aria-expanded", "false");

  target.addEventListener(
    "contextmenu",
    (e) => {
      if (shouldIgnoreNativeTarget(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
      openContextMenu(target, menu, { x: e.clientX, y: e.clientY });
    },
    { signal: controller.signal },
  );

  target.addEventListener(
    "keydown",
    (e) => {
      if (e.key !== "ContextMenu" && !(e.shiftKey && e.key === "F10")) return;
      if (shouldIgnoreNativeTarget(e.target)) return;
      e.preventDefault();
      openFromKeyboard(target, menu);
    },
    { signal: controller.signal },
  );

  target.addEventListener(
    "pointerdown",
    (e) => {
      const delay = getLongPressDelay(target, menu);
      if (e.pointerType !== "touch" || delay == null || shouldIgnoreNativeTarget(e.target)) {
        return;
      }

      clearLongPress(state);
      state.pointerId = e.pointerId;
      state.startX = e.clientX;
      state.startY = e.clientY;
      state.timer = setTimeout(() => {
        state.timer = null;
        state.suppressClickUntil = Date.now() + 750;
        openContextMenu(target, menu, {
          x: state.startX,
          y: state.startY,
        });
      }, delay);
    },
    { signal: controller.signal, passive: true },
  );

  target.addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerId !== state.pointerId || !state.timer) return;
      if (
        Math.abs(e.clientX - state.startX) > MOVE_TOLERANCE ||
        Math.abs(e.clientY - state.startY) > MOVE_TOLERANCE
      ) {
        clearLongPress(state);
      }
    },
    { signal: controller.signal, passive: true },
  );

  for (const type of ["pointerup", "pointercancel", "pointerleave"]) {
    target.addEventListener(
      type,
      (e) => {
        if (e.pointerId === state.pointerId) clearLongPress(state);
      },
      { signal: controller.signal, passive: true },
    );
  }

  target.addEventListener(
    "click",
    (e) => {
      if (Date.now() <= state.suppressClickUntil) {
        e.preventDefault();
        e.stopPropagation();
        state.suppressClickUntil = 0;
      }
    },
    { signal: controller.signal, capture: true },
  );

  contextMap.set(target, state);
}

function disconnectContextTarget(target) {
  const state = contextMap.get(target);
  if (!state) return;
  clearLongPress(state);
  state.controller.abort();
  if (state.addedAriaControls) target.removeAttribute("aria-controls");
  if (state.addedAriaHaspopup) target.removeAttribute("aria-haspopup");
  if (state.addedAriaExpanded) target.removeAttribute("aria-expanded");
  contextMap.delete(target);
}

enhance({
  "[data-context-menu]": (target) => {
    connectContextTarget(target);
    return () => disconnectContextTarget(target);
  },
  "menu, [role='menu']": (menu) => () => disconnectSurface(menu),
});
