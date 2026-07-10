import { firstItem, lastItem, nextItem } from "./keys.js";
import { isElementVisible } from "./focus.js";

const MENU_ITEM_TARGET_SELECTORS = ["button", "a", '[role="menuitem"]'];
export const MENU_ITEM_SELECTOR = MENU_ITEM_TARGET_SELECTORS.flatMap((target) => [
  `.flyout > ${target}`,
  `.flyout > li > ${target}`,
  `.flyout > section > ul > li > ${target}`,
]).join(",");

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
  const item = document.activeElement;
  if (!menu.contains(item) || !isAriaMenuItem(item)) return false;

  item.click();
  return true;
}

export function hasMenuItems(menu) {
  return getMenuItems(menu).length > 0;
}

export function hasMenuItem(target) {
  return !!target.closest?.(MENU_ITEM_SELECTOR);
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
      nextItem(items, document.activeElement, 1, { wrap: true })?.focus();
      break;
    case "ArrowUp":
      e.preventDefault();
      nextItem(items, document.activeElement, -1, { wrap: true })?.focus();
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
