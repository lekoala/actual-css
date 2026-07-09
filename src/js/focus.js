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

function isFocusable(el) {
  return (
    el.tabIndex >= 0 &&
    !el.matches(":disabled") &&
    el.checkVisibility?.() !== false &&
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
