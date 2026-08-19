/*
 * Keyboard helpers for small roving-focus widgets.
 *
 * Components still own key dispatch and side effects. These helpers only
 * centralize item lookup, edge handling, and optional wrapping.
 */

export function firstItem(items) {
  return items[0] || null;
}

export function lastItem(items) {
  return items[items.length - 1] || null;
}

export function nextItem(items, current, delta, opts = {}) {
  if (!items.length) return null;

  const wrap = opts.wrap !== false;
  const idx = items.indexOf(current);
  if (idx === -1) {
    return delta > 0 ? firstItem(items) : lastItem(items);
  }

  const next = idx + delta;
  if (!wrap) return items[next] || null;

  const wrapped = ((next % items.length) + items.length) % items.length;
  return items[wrapped];
}

export function itemForKey(items, current, key, opts = {}) {
  const orientation = opts.orientation || "horizontal";
  const wrap = opts.wrap === true;
  const direction = opts.direction || "ltr";

  switch (key) {
    case "Home":
      return firstItem(items);
    case "End":
      return lastItem(items);
    case "ArrowRight":
      if (orientation !== "horizontal") return null;
      return nextItem(items, current, direction === "rtl" ? -1 : 1, { wrap });
    case "ArrowLeft":
      if (orientation !== "horizontal") return null;
      return nextItem(items, current, direction === "rtl" ? 1 : -1, { wrap });
    case "ArrowDown":
      if (orientation !== "vertical") return null;
      return nextItem(items, current, 1, { wrap });
    case "ArrowUp":
      if (orientation !== "vertical") return null;
      return nextItem(items, current, -1, { wrap });
    default:
      return null;
  }
}
