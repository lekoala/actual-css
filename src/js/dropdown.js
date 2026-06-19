/*
 * Dropdown — positioned panel attached to a trigger.
 *
 * Two modes, detected automatically:
 *   App-menu:  button[aria-haspopup="menu"] → keyboard nav via [role="menuitem"]
 *   Nav-panel: .dropdown > [aria-expanded][aria-controls] → toggle only, no
 *              arrow-key nav (sections, links, and mixed content)
 *
 * Keyboard: ArrowUp/Down, Home/End, Enter (app-menu only)
 * Dismiss:  outside click, Escape with focus return
 *
 * Self-registers via observer: injected dropdowns wire automatically.
 * Menu listeners + floating tracking attach lazily on first open.
 * Cleanup is handled by AbortController per trigger and per menu; open
 * state and floating.track() are released on disconnect.
 */

import { track, reposition } from "./floating.js";
import { firstItem, lastItem, nextItem } from "./keys.js";
import observer from "./observer.js";

const openMenus = new Set();
let activeMenu = null;

// trigger -> { menu, controller }
const triggerMap = new WeakMap();
// menu -> { trigger, untrack, controller }
const menuMap = new WeakMap();

// ── Global: outside click & escape ─────────────────────

if (typeof document !== "undefined") {
  document.addEventListener("click", (e) => {
    for (const menu of openMenus) {
      if (!menu.contains(e.target)) {
        closeMenu(menu);
      }
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && openMenus.size > 0) {
      const menu = activeMenu || [...openMenus][openMenus.size - 1];
      const trigger = menuMap.get(menu)?.trigger;
      closeMenu(menu);
      trigger?.focus();
    }
  });
}

// ── Open / close ───────────────────────────────────────

function ensureMenuWired(menu, trigger, isAppMenu) {
  if (menuMap.has(menu)) return;
  const untrack = track(menu);
  const controller = new AbortController();

  menu.addEventListener(
    "floating:reposition",
    () => {
      if (!menu.hidden) {
        reposition(trigger, menu, {
          placement: "bottom-start",
          distance: 4,
          flip: true,
          shift: true,
        });
      }
    },
    { signal: controller.signal },
  );

  menu.addEventListener(
    "floating:hide",
    () => {
      if (!menu.hidden) closeMenu(menu);
    },
    { signal: controller.signal },
  );

  if (isAppMenu) {
    menu.addEventListener("keydown", onMenuKeydown, { signal: controller.signal });
    menu.addEventListener("click", onMenuClick, { signal: controller.signal });
  }

  menuMap.set(menu, { trigger, untrack, controller });
}

function openMenu(menu, trigger) {
  if (!menu || !menu.isConnected) return;
  if (menu.classList.contains("is-open")) return;
  // Mutual exclusion: close any other open menu before opening this one.
  for (const other of openMenus) {
    if (other !== menu) closeMenu(other);
  }
  const isAppMenu = trigger.getAttribute("aria-haspopup") === "menu";
  ensureMenuWired(menu, trigger, isAppMenu);
  menu.classList.add("is-open");
  menu.hidden = false;
  menu.style.display = "";
  trigger.setAttribute("aria-expanded", "true");
  openMenus.add(menu);
  activeMenu = menu;
  reposition(trigger, menu, { placement: "bottom-start", distance: 4, flip: true, shift: true });
}

function closeMenu(menu) {
  if (!menu || !menu.classList.contains("is-open")) return;
  menu.classList.remove("is-open");
  menu.hidden = true;
  menu.style.display = "none";
  const ms = menuMap.get(menu);
  if (ms) ms.trigger.setAttribute("aria-expanded", "false");
  openMenus.delete(menu);
  if (activeMenu === menu) {
    activeMenu = [...openMenus][openMenus.size - 1] || null;
  }
}

// ── Keyboard nav (app-menu only) ──────────────────────

function getItems(menu) {
  return [...menu.querySelectorAll('[role="menuitem"]:not([disabled]):not([aria-disabled="true"])')];
}

function focusMenuItem(menu, item) {
  if (menu.hidden) return;
  item?.focus();
}

function menuItemAt(menu, edge) {
  const items = getItems(menu);
  return edge === "last" ? lastItem(items) : firstItem(items);
}

function navMenu(menu, dir) {
  const items = getItems(menu);
  if (!items.length) return;
  nextItem(items, document.activeElement, dir, { wrap: true })?.focus();
}

// ── Event handlers ─────────────────────────────────────

function onTriggerClick(e) {
  const trigger = e.currentTarget;
  const state = triggerMap.get(trigger);
  if (!state) return;
  e.stopPropagation();
  const menu = state.menu;
  if (!menu || !menu.isConnected) return;
  if (menu.hidden) openMenu(menu, trigger);
  else closeMenu(menu);
}

function onTriggerKeydown(e) {
  const trigger = e.currentTarget;
  const state = triggerMap.get(trigger);
  if (!state) return;
  const menu = state.menu;
  if (!menu || !menu.isConnected) return;
  const items = getItems(menu);
  if (!items.length) return;

  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      if (menu.hidden) openMenu(menu, trigger);
      focusMenuItem(menu, menuItemAt(menu, "first"));
      break;
    case "ArrowUp":
      e.preventDefault();
      if (menu.hidden) openMenu(menu, trigger);
      focusMenuItem(menu, menuItemAt(menu, "last"));
      break;
    case "Home":
      e.preventDefault();
      if (menu.hidden) openMenu(menu, trigger);
      focusMenuItem(menu, menuItemAt(menu, "first"));
      break;
    case "End":
      e.preventDefault();
      if (menu.hidden) openMenu(menu, trigger);
      focusMenuItem(menu, menuItemAt(menu, "last"));
      break;
    case "Enter":
    case " ":
      e.preventDefault();
      if (menu.hidden) {
        openMenu(menu, trigger);
        focusMenuItem(menu, menuItemAt(menu, "first"));
      } else {
        closeMenu(menu);
      }
      break;
    case "Tab":
      if (!menu.hidden) closeMenu(menu);
      break;
  }
}

function onMenuKeydown(e) {
  const menu = e.currentTarget;
  const items = getItems(menu);
  if (!items.length) return;

  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      navMenu(menu, 1);
      break;
    case "ArrowUp":
      e.preventDefault();
      navMenu(menu, -1);
      break;
    case "Home":
      e.preventDefault();
      firstItem(items)?.focus();
      break;
    case "End":
      e.preventDefault();
      lastItem(items)?.focus();
      break;
    case "Tab":
      closeMenu(menu);
      break;
    case "Enter":
    case " ":
      e.preventDefault();
      document.activeElement?.click();
      closeMenu(menu);
      break;
  }
}

function onMenuClick(e) {
  const menu = e.currentTarget;
  const item = e.target.closest('[role="menuitem"]');
  if (item) closeMenu(menu);
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

  menu.style.position = "fixed";
  menu.hidden = true;
  menu.style.display = "none";

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
  if (openMenus.has(menu)) closeMenu(menu);
  const ms = menuMap.get(menu);
  if (ms) {
    ms.untrack();
    ms.controller.abort();
    menuMap.delete(menu);
  }
}

// ── Self-registration ──────────────────────────────────

if (typeof document !== "undefined") {
  observer(
    ['[aria-haspopup="menu"]', ".dropdown > [aria-expanded][aria-controls]", ".dropdown-menu"],
    (el, connected, selector) => {
      if (selector === ".dropdown-menu") {
        if (connected) connectMenu(el);
        else disconnectMenu(el);
      } else if (connected) {
        connectTrigger(el);
      } else {
        disconnectTrigger(el);
      }
    },
  );
}
