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
 */

import { track, reposition } from "./floating.js";

const openMenus = new Set();
let activeMenu = null;

// ── Global: outside click & escape ─────────────────────

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
    closeMenu(menu);
    menu?._trigger?.focus();
  }
});

// ── Open / close ───────────────────────────────────────

function openMenu(menu, trigger) {
  if (menu.classList.contains("is-open")) return;
  menu.classList.add("is-open");
  menu.hidden = false;
  menu.style.display = "";
  trigger.setAttribute("aria-expanded", "true");
  openMenus.add(menu);
  activeMenu = menu;
  menu._trigger = trigger;
  reposition(trigger, menu, { placement: "bottom-start", distance: 4, flip: true, shift: true });

  // focus first menuitem for app-menus
  const isMenu = trigger.getAttribute("aria-haspopup") === "menu";
  if (isMenu) {
    const first = menu.querySelector('[role="menuitem"]');
    requestAnimationFrame(() => first?.focus());
  }
}

function closeMenu(menu) {
  if (!menu.classList.contains("is-open")) return;
  menu.classList.remove("is-open");
  menu.hidden = true;
  menu.style.display = "none";
  const trigger = menu._trigger;
  if (trigger) trigger.setAttribute("aria-expanded", "false");
  openMenus.delete(menu);
  if (activeMenu === menu) {
    activeMenu = [...openMenus][openMenus.size - 1] || null;
  }
}

// ── Keyboard nav (app-menu only) ──────────────────────

function getItems(menu) {
  return [...menu.querySelectorAll('[role="menuitem"]:not([disabled])')];
}

function navMenu(menu, dir) {
  const items = getItems(menu);
  if (!items.length) return;
  const idx = items.indexOf(document.activeElement);
  let next = idx + dir;
  if (next >= items.length) next = 0;
  if (next < 0) next = items.length - 1;
  items[next].focus();
}

// ── Wire up a single trigger ──────────────────────────

function wireTrigger(trigger, menu, isAppMenu) {
  if (trigger._ddInit) return;
  trigger._ddInit = true;

  menu._trigger = trigger;
  menu.style.position = "fixed";
  menu.hidden = true;
  menu.style.display = "none";

  track(menu);

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    if (menu.hidden) {
      openMenu(menu, trigger);
    } else {
      closeMenu(menu);
    }
  });

  // repaint on resize while open
  menu.addEventListener("floating:reposition", () => {
    if (!menu.hidden) {
      reposition(trigger, menu, {
        placement: "bottom-start",
        distance: 4,
        flip: true,
        shift: true,
      });
    }
  });

  menu.addEventListener("floating:hide", () => {
    if (!menu.hidden) closeMenu(menu);
  });

  if (isAppMenu) {
    menu.addEventListener("keydown", (e) => {
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
          items[0].focus();
          break;
        case "End":
          e.preventDefault();
          items[items.length - 1].focus();
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
    });

    menu.addEventListener("click", (e) => {
      const item = e.target.closest('[role="menuitem"]');
      if (item) closeMenu(menu);
    });
  }
}

// ── Initialization ─────────────────────────────────────

export function initDropdowns() {
  // App-menu: button[aria-haspopup="menu"]
  const menuTriggers = document.querySelectorAll('[aria-haspopup="menu"]');
  for (const trigger of menuTriggers) {
    const menuId = trigger.getAttribute("aria-controls");
    if (!menuId) continue;
    const menu = document.getElementById(menuId);
    if (!menu) continue;
    wireTrigger(trigger, menu, true);
  }

  // Nav-panel: .dropdown > [aria-expanded][aria-controls] (not already wired)
  const navTriggers = document.querySelectorAll(".dropdown > [aria-expanded][aria-controls]");
  for (const trigger of navTriggers) {
    if (trigger._ddInit) continue;
    const menuId = trigger.getAttribute("aria-controls");
    const menu = document.getElementById(menuId);
    if (!menu) continue;
    wireTrigger(trigger, menu, false);
  }
}
