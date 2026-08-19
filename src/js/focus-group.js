import { itemForKey } from "./keys.js";

const ORIENTATIONS = new Set(["horizontal", "vertical"]);

function restoreTabIndex(item, value) {
  if (value == null) item.removeAttribute("tabindex");
  else item.setAttribute("tabindex", value);
}

export function connectFocusGroup(root, opts = {}) {
  if (!root?.addEventListener || !root?.contains) {
    throw new TypeError("connectFocusGroup() requires a root element.");
  }
  if (typeof opts.getItems !== "function") {
    throw new TypeError("connectFocusGroup() requires getItems().");
  }

  const orientation = opts.orientation || "horizontal";
  if (!ORIENTATIONS.has(orientation)) {
    throw new TypeError(`Invalid focus-group orientation: ${orientation}`);
  }

  const controller = new AbortController();
  const externalSignal = opts.signal || null;
  const originalTabIndex = new Map();
  let remembered = null;
  let disconnected = false;

  function getItems() {
    const seen = new Set();
    return [...(opts.getItems() || [])].filter((item) => {
      if (typeof item?.focus !== "function" || !root.contains(item) || seen.has(item)) return false;
      seen.add(item);
      return true;
    });
  }

  function restore(item) {
    if (!originalTabIndex.has(item)) return;
    restoreTabIndex(item, originalTabIndex.get(item));
    originalTabIndex.delete(item);
  }

  function sync(preferred = remembered) {
    if (disconnected) return [];

    const items = getItems();
    const itemSet = new Set(items);
    for (const item of originalTabIndex.keys()) {
      if (!itemSet.has(item)) restore(item);
    }

    const active = root.ownerDocument.activeElement;
    const target =
      (itemSet.has(preferred) && preferred) ||
      (itemSet.has(active) && active) ||
      items.find((item) => item.tabIndex === 0) ||
      items[0] ||
      null;

    for (const item of items) {
      if (!originalTabIndex.has(item)) {
        originalTabIndex.set(item, item.getAttribute("tabindex"));
      }
      const tabIndex = item === target ? 0 : -1;
      item.tabIndex = tabIndex;
    }
    remembered = target;
    return items;
  }

  function onFocusIn(event) {
    const items = getItems();
    if (items.includes(event.target)) sync(event.target);
  }

  function onKeydown(event) {
    const items = sync();
    const current = root.ownerDocument.activeElement;
    if (!items.includes(current)) return;

    const style = root.ownerDocument.defaultView?.getComputedStyle?.(root);
    const direction = style?.direction === "rtl" ? "rtl" : "ltr";
    const target = itemForKey(items, current, event.key, {
      orientation,
      wrap: opts.wrap === true,
      direction,
    });
    if (!target) return;

    event.preventDefault();
    sync(target);
    target.focus();
  }

  root.addEventListener("focusin", onFocusIn, { signal: controller.signal });
  root.addEventListener("keydown", onKeydown, { signal: controller.signal });

  sync();

  function disconnect() {
    if (disconnected) return;
    disconnected = true;
    externalSignal?.removeEventListener("abort", disconnect);
    controller.abort();
    for (const item of originalTabIndex.keys()) restore(item);
    remembered = null;
  }

  if (externalSignal) {
    if (externalSignal.aborted) disconnect();
    else externalSignal.addEventListener("abort", disconnect, { once: true });
  }

  return { sync, disconnect };
}
