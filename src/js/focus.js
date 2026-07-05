const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function getFocusable(root) {
  return [...root.querySelectorAll(FOCUSABLE_SELECTOR)].filter(
    (el) => !el.hidden && el.getAttribute("aria-hidden") !== "true",
  );
}

export function focusFirstDescendant(root) {
  const target = getFocusable(root)[0];
  target?.focus();
  return !!target;
}
