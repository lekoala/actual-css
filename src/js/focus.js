const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button",
  "input",
  "select",
  "textarea",
  "summary",
  "[contenteditable]:not([contenteditable='false'])",
  "[tabindex]",
].join(",");

export function isElementVisible(el) {
  if (!el || el.hidden) return false;
  if (typeof el.checkVisibility === "function") return el.checkVisibility();
  if (el.getClientRects().length === 0) return false;
  // checkVisibility() covers visibility:hidden; without it, read the
  // computed direction of the cascade so a hidden element is not focusable.
  const style = el.ownerDocument?.defaultView?.getComputedStyle?.(el);
  if (!style) return true;
  return style.visibility !== "hidden" && style.visibility !== "collapse";
}

function isFocusable(el) {
  return (
    el.tabIndex >= 0 &&
    !el.matches(":disabled") &&
    isElementVisible(el) &&
    !el.closest('[inert], [aria-hidden="true"]')
  );
}

export function getFocusable(root) {
  return [...root.querySelectorAll(FOCUSABLE_SELECTOR)].filter(isFocusable);
}

export function focusFirstDescendant(root) {
  const target = getFocusable(root)[0];
  target?.focus();
  return !!target;
}
