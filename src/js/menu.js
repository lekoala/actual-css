import { isElementVisible } from "./focus.js";
import { connectFocusGroup } from "./focus-group.js";
import { firstItem, itemForKey, lastItem } from "./keys.js";

const MENU_ITEM_SELECTOR = ":scope > li > .menu-item";
const MENU_ITEM_ROLES = new Set(["menuitem", "menuitemcheckbox", "menuitemradio"]);

function isUsableMenuItem(item) {
  return (
    !item.disabled &&
    item.getAttribute("aria-disabled") !== "true" &&
    isElementVisible(item) &&
    !item.closest("[hidden], [inert], [aria-hidden='true']")
  );
}

export function getMenuItems(menu) {
  return [...menu.querySelectorAll(MENU_ITEM_SELECTOR)].filter(isUsableMenuItem);
}

function isAriaMenuItem(item) {
  return MENU_ITEM_ROLES.has(item.getAttribute("role"));
}

function activateCurrentItem(menu) {
  const item = menu.ownerDocument.activeElement;
  if (!menu.contains(item) || !isAriaMenuItem(item)) return false;

  item.click();
  return true;
}

export function hasMenuItems(menu) {
  return getMenuItems(menu).length > 0;
}

function getMenuItem(menu, target) {
  const item = target?.closest?.(".menu-item");
  return item?.parentElement?.parentElement === menu ? item : null;
}

export function hasMenuItem(menu, target) {
  return !!getMenuItem(menu, target);
}

export function focusFirstMenuItem(menu) {
  firstItem(getMenuItems(menu))?.focus();
}

export function focusLastMenuItem(menu) {
  lastItem(getMenuItems(menu))?.focus();
}

export function onMenuKeydown(e, { close, navigate = true }) {
  const menu = e.currentTarget;
  if (navigate) {
    const items = getMenuItems(menu);
    const target = itemForKey(items, menu.ownerDocument.activeElement, e.key, {
      orientation: "vertical",
      wrap: true,
    });
    if (target) {
      e.preventDefault();
      target.focus();
      return;
    }
  }

  switch (e.key) {
    case "Tab":
      close(menu);
      break;
    case "Enter":
    case " ":
      if (activateCurrentItem(menu)) {
        e.preventDefault();
      }
      break;
  }
}

// Menu wiring is a shared, ref-counted resource: a menu may be retained by
// several triggers (or by flyout and context-menu at once), so the listeners
// and their AbortController belong to the menu, not to any single caller.
// Each retain returns a release(); the wiring is torn down on the last one.
const menuConnections = new WeakMap();

export function connectMenu(menu, { close }) {
  let entry = menuConnections.get(menu);

  if (!entry) {
    const controller = new AbortController();
    const focusGroup = menu.matches('[role="menu"]')
      ? connectFocusGroup(menu, {
          getItems: () => getMenuItems(menu).filter(isAriaMenuItem),
          orientation: "vertical",
          wrap: true,
          signal: controller.signal,
        })
      : null;
    menu.addEventListener(
      "keydown",
      (event) =>
        onMenuKeydown(event, {
          close: () => close(menu),
          navigate: !focusGroup,
        }),
      { signal: controller.signal },
    );
    menu.addEventListener(
      "click",
      (event) => {
        const item = getMenuItem(menu, event.target);
        if (!item) return;

        if (item.matches(":disabled, [aria-disabled='true']")) {
          event.preventDefault();
          // A disabled command must not reach the surface-level inside-click
          // policy and dismiss the menu as if it had been activated.
          event.stopPropagation();
          return;
        }
      },
      { signal: controller.signal },
    );
    entry = { count: 0, controller, focusGroup };
    menuConnections.set(menu, entry);
  }

  entry.count++;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    entry.count--;
    if (entry.count <= 0) {
      entry.focusGroup?.disconnect();
      entry.controller.abort();
      menuConnections.delete(menu);
    }
  };
}
