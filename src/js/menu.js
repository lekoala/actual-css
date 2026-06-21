import { firstItem, lastItem, nextItem } from "./keys.js";

export function getMenuItems(menu) {
  return [
    ...menu.querySelectorAll('[role="menuitem"]:not([disabled]):not([aria-disabled="true"])'),
  ];
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
      e.preventDefault();
      document.activeElement?.click();
      close(menu);
      break;
  }
}
