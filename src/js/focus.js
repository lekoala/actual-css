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

/*
 * The branch below checkVisibility() is not dead code: checkVisibility() is
 * Safari 17.4 and the floor is Safari 17, so it is the branch that runs at the
 * bottom of the supported range — where it also decides whether a closed
 * popover's contents are reachable. Measured there; do not drop it.
 */
export function isElementVisible(el) {
  if (!el || el.hidden) return false;
  if (typeof el.checkVisibility === "function") {
    // Bare checkVisibility() only tests for a layout box — visibility:hidden
    // requires the option. Both names are passed because the engines that
    // shipped first knew it as checkVisibilityCSS.
    return el.checkVisibility({ visibilityProperty: true, checkVisibilityCSS: true });
  }
  if (el.getClientRects().length === 0) return false;
  // The fallback reproduces the option's coverage through the computed style
  // so a hidden element is not focusable.
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
