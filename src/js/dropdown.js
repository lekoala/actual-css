/*
 * Dropdown — trigger adapter over the shared action-surface runtime.
 *
 * App menus keep roving focus and menuitem activation. Nav panels reuse the
 * same surface lifecycle without menu semantics.
 */

import enhance from "./enhance.js";
import { focusFirstMenuItem, focusLastMenuItem, getMenuItems } from "./menu.js";
import {
  closeSurface,
  disconnectSurface,
  isSurfaceOpen,
  openSurface,
  prepareSurface,
} from "./surface.js";

// trigger -> { menu, controller }
const triggerMap = new WeakMap();

// ── Event handlers ─────────────────────────────────────

function onTriggerClick(e) {
  const trigger = e.currentTarget;
  const state = triggerMap.get(trigger);
  if (!state) return;
  e.stopPropagation();
  const menu = state.menu;
  if (!menu || !menu.isConnected) return;
  if (isSurfaceOpen(menu)) closeSurface(menu);
  else openSurface(menu, { trigger, source: trigger, placement: "bottom-start", distance: 4 });
}

function onTriggerKeydown(e) {
  const trigger = e.currentTarget;
  const state = triggerMap.get(trigger);
  if (!state) return;
  const menu = state.menu;
  if (!menu || !menu.isConnected) return;
  const items = getMenuItems(menu);
  if (!items.length) return;

  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      if (!isSurfaceOpen(menu)) {
        openSurface(menu, { trigger, source: trigger, placement: "bottom-start", distance: 4 });
      }
      focusFirstMenuItem(menu);
      break;
    case "ArrowUp":
      e.preventDefault();
      if (!isSurfaceOpen(menu)) {
        openSurface(menu, { trigger, source: trigger, placement: "bottom-start", distance: 4 });
      }
      focusLastMenuItem(menu);
      break;
    case "Home":
      e.preventDefault();
      if (!isSurfaceOpen(menu)) {
        openSurface(menu, { trigger, source: trigger, placement: "bottom-start", distance: 4 });
      }
      focusFirstMenuItem(menu);
      break;
    case "End":
      e.preventDefault();
      if (!isSurfaceOpen(menu)) {
        openSurface(menu, { trigger, source: trigger, placement: "bottom-start", distance: 4 });
      }
      focusLastMenuItem(menu);
      break;
    case "Enter":
    case " ":
      e.preventDefault();
      if (!isSurfaceOpen(menu)) {
        openSurface(menu, { trigger, source: trigger, placement: "bottom-start", distance: 4 });
        focusFirstMenuItem(menu);
      } else {
        closeSurface(menu);
      }
      break;
    case "Tab":
      if (isSurfaceOpen(menu)) closeSurface(menu);
      break;
  }
}

// ── Lifecycle: connect / disconnect ────────────────────

function connectTrigger(trigger) {
  if (triggerMap.has(trigger)) return;
  const menuId = trigger.getAttribute("aria-controls");
  const menu = menuId && document.getElementById(menuId);
  if (!menu) return;

  const isAppMenu = trigger.getAttribute("aria-haspopup") === "menu";
  const controller = new AbortController();
  triggerMap.set(trigger, { menu, controller });

  prepareSurface(menu, trigger);

  trigger.addEventListener("click", onTriggerClick, { signal: controller.signal });
  if (isAppMenu) {
    trigger.addEventListener("keydown", onTriggerKeydown, { signal: controller.signal });
  }
}

function disconnectTrigger(trigger) {
  const state = triggerMap.get(trigger);
  if (!state) return;
  state.controller.abort();
  disconnectMenu(state.menu);
  triggerMap.delete(trigger);
}

function connectMenu(menu) {
  if (!menu.id) return;
  // Wire any trigger that references this menu but wasn't wired yet
  // (trigger connected before its menu was present).
  const triggers = document.querySelectorAll(`[aria-controls="${CSS.escape(menu.id)}"]`);
  for (const trigger of triggers) {
    if (!triggerMap.has(trigger)) connectTrigger(trigger);
  }
}

function disconnectMenu(menu) {
  if (!menu) return;
  disconnectSurface(menu);
}

// ── Self-registration ──────────────────────────────────

if (typeof document !== "undefined") {
  enhance({
    '[aria-haspopup="menu"], .dropdown > [aria-expanded][aria-controls]': (trigger) => {
      connectTrigger(trigger);
      return () => disconnectTrigger(trigger);
    },
    ".dropdown-menu": (menu) => {
      connectMenu(menu);
      return () => disconnectMenu(menu);
    },
  });
}
