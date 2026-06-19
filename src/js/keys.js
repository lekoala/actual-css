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
