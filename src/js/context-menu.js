import enhance from "./enhance.js";
import { EVENTS } from "./events.js";
import { connectMenu, focusFirstMenuItem, hasMenuItems } from "./menu.js";
import { closeSurface, isSurfaceOpen, openSurface, retainSurface } from "./surface.js";

const LONG_PRESS_MS = 450;
const MOVE_TOLERANCE = 10;
const CONTEXT_MENU_SELECTOR = 'menu, [role="menu"]';
const CONTEXT_TARGET_SELECTOR = "[data-context-menu]";
const contextMap = new WeakMap();
const contextByMenu = new WeakMap();

export function contextFor(menu) {
  return contextByMenu.get(menu) || null;
}

function menuFor(target) {
  const id = target.getAttribute("data-context-menu");
  const menu = id ? target.ownerDocument.getElementById(id) : null;
  return menu?.matches(CONTEXT_MENU_SELECTOR) ? menu : null;
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
  return Number.isFinite(delay) ? Math.max(0, delay) : LONG_PRESS_MS;
}

function readPanelOptions(menu) {
  const opts = {};
  const ds = menu.dataset;
  if (ds.flyoutMobile) opts.mobile = ds.flyoutMobile;
  if (ds.flyoutAutoClose) opts.autoClose = ds.flyoutAutoClose;
  return opts;
}

function focusMenuContainer(menu) {
  if (!menu.hasAttribute("tabindex")) {
    menu.tabIndex = -1;
  }
  menu.focus();
}

function focusMenu(menu, mode) {
  if (mode === "first-item") {
    if (hasMenuItems(menu)) focusFirstMenuItem(menu);
  } else {
    focusMenuContainer(menu);
  }
}

function requestContextMenu(context, menu, opts = {}) {
  const detail = {
    menu,
    context,
    origin: opts.origin || context,
    trigger: opts.trigger,
  };
  const event = new CustomEvent(EVENTS.contextMenu, {
    bubbles: true,
    cancelable: true,
    detail,
  });
  if (!context.dispatchEvent(event)) return null;
  contextByMenu.set(menu, detail);
  return detail;
}

function openContextMenu(context, menu, opts = {}) {
  if (!requestContextMenu(context, menu, opts)) return;
  if (isSurfaceOpen(menu)) closeSurface(menu);
  if (
    openSurface(menu, {
      source: context,
      x: opts.x,
      y: opts.y,
      placement: opts.placement || "bottom-start",
      distance: opts.distance ?? 2,
      mobile: opts.mobile || "auto",
      scope: opts.scope || getContextScope(context),
      restoreFocusTo: opts.restoreFocusTo,
      ...readPanelOptions(menu),
    })
  ) {
    focusMenu(menu, opts.focus);
  }
}

function openFromKeyboard(context, menu, origin = context, restoreFocusTo) {
  const rect = origin.getBoundingClientRect();
  openContextMenu(context, menu, {
    x: rect.left,
    y: rect.bottom,
    placement: "bottom-start",
    distance: 4,
    focus: "first-item",
    origin,
    trigger: "keyboard",
    restoreFocusTo,
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

  const release = retainSurface(menu);
  const controller = new AbortController();
  const releaseMenu = connectMenu(menu, {
    close: (menu) => closeSurface(menu),
  });
  const state = {
    controller,
    releaseMenu,
    menu,
    release,
    timer: null,
    pointerId: null,
    startX: 0,
    startY: 0,
    suppressClickUntil: 0,
  };

  target.addEventListener(
    "contextmenu",
    (e) => {
      if (shouldIgnoreNativeTarget(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
      openContextMenu(target, menu, {
        x: e.clientX,
        y: e.clientY,
        origin: e.target,
        trigger: "pointer",
      });
    },
    { signal: controller.signal },
  );

  target.addEventListener(
    "keydown",
    (e) => {
      if (e.key !== "ContextMenu" && !(e.shiftKey && e.key === "F10")) return;
      if (shouldIgnoreNativeTarget(e.target)) return;
      e.preventDefault();
      openFromKeyboard(target, menu, e.target, target);
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
          origin: e.target,
          trigger: "touch",
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

  target.addEventListener(
    "click",
    (e) => {
      const trigger = e.target.closest("[data-context-menu-trigger]");
      if (
        !trigger ||
        trigger.getAttribute("aria-controls") !== target.getAttribute("data-context-menu")
      )
        return;

      e.preventDefault();
      e.stopPropagation();

      if (isSurfaceOpen(menu)) {
        closeSurface(menu);
        return;
      }

      if (!requestContextMenu(target, menu, { origin: trigger, trigger: "button" })) return;

      const rect = trigger.getBoundingClientRect();
      if (
        openSurface(menu, {
          source: target,
          x: rect.left,
          y: rect.bottom,
          placement: "bottom-start",
          distance: 4,
          restoreFocusTo: trigger,
          ...readPanelOptions(menu),
        })
      ) {
        focusMenuContainer(menu);
      }
    },
    { signal: controller.signal },
  );

  contextMap.set(target, state);
}

function disconnectContextTarget(target) {
  const state = contextMap.get(target);
  if (!state) return;
  clearLongPress(state);
  state.controller.abort();
  state.releaseMenu?.();
  if (contextFor(state.menu)?.context === target) {
    contextByMenu.delete(state.menu);
    closeSurface(state.menu, { restoreFocus: false });
  }
  state.release();
  contextMap.delete(target);
}

enhance({
  [CONTEXT_TARGET_SELECTOR]: (target) => {
    connectContextTarget(target);
    return () => disconnectContextTarget(target);
  },
});
