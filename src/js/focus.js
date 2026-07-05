const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "summary",
  "[contenteditable]:not([contenteditable='false'])",
  "[tabindex]",
].join(",");

export function getFocusable(root) {
  return [...root.querySelectorAll(FOCUSABLE_SELECTOR)].filter(
    (el) =>
      el.tabIndex >= 0 &&
      el.checkVisibility?.() !== false &&
      !el.closest('[inert], [aria-hidden="true"]'),
  );
}

export function focusFirstDescendant(root) {
  const target = getFocusable(root)[0];
  target?.focus();
  return !!target;
}
