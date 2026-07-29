import { isElementVisible } from "./focus.js";
import { firstItem, lastItem, nextItem } from "./keys.js";
import { getSurfaceAutoClose } from "./surface.js";

const MENU_ITEM_SELECTOR = ":scope > li > .menu-item";

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
  return item.getAttribute("role") === "menuitem";
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

export function onMenuKeydown(e, { close }) {
  const menu = e.currentTarget;
  const items = getMenuItems(menu);
  if (!items.length) return;

  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      nextItem(items, menu.ownerDocument.activeElement, 1, { wrap: true })?.focus();
      break;
    case "ArrowUp":
      e.preventDefault();
      nextItem(items, menu.ownerDocument.activeElement, -1, { wrap: true })?.focus();
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
      close(menu);
      break;
    case "Enter":
    case " ":
      if (activateCurrentItem(menu)) {
        e.preventDefault();
        close(menu);
      }
      break;
  }
}

export function connectMenu(menu, { close, signal }) {
  menu.addEventListener("keydown", (event) => onMenuKeydown(event, { close: () => close(menu) }), {
    signal,
  });

  menu.addEventListener(
    "click",
    (event) => {
      const autoClose = getSurfaceAutoClose(menu);
      if (autoClose === "outside" || autoClose === "false") return;

      const item = getMenuItem(menu, event.target);
      if (!item) return;

      if (item.matches(":disabled, [aria-disabled='true']")) {
        event.preventDefault();
        return;
      }

      close(menu);
    },
    { signal },
  );
}
