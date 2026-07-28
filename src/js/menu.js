import { isElementVisible } from "./focus.js";
import { firstItem, lastItem, nextItem } from "./keys.js";

const MENU_ITEM = 'button, a, [role="menuitem"]';
// Mirrors the item contract in flyout.css: an item sits directly in the surface,
// or directly in any of its <li> — bare list, or grouped section > ul > li.
// `:scope li` must stay a *descendant* combinator for that second form; the
// grouped flyouts in docs/ui.md lose roving focus with `:scope > li`.
// Scoping is what keeps a neighbouring surface's items out: this selector only
// ever runs against one surface, and hasMenuItem() resolves the clicked item
// through this list rather than through a global closest().
const MENU_ITEM_SELECTOR = `:scope > :is(${MENU_ITEM}), :scope li > :is(${MENU_ITEM})`;

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

export function hasMenuItem(menu, target) {
  const item = target?.closest?.(MENU_ITEM);
  return !!item && getMenuItems(menu).includes(item);
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
