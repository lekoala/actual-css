import { Window } from "happy-dom";
import { installPopoverTestStub } from "./popover-stub.js";

const assignedGlobals = [
  "WeakRef",
  "window",
  "document",
  "Document",
  "DocumentFragment",
  "HTMLElement",
  "HTMLDialogElement",
  "HTMLFormElement",
  "Element",
  "Node",
  "Event",
  "MutationObserver",
  "CustomEvent",
  "KeyboardEvent",
  "MouseEvent",
  "FocusEvent",
  "CSS",
  "requestAnimationFrame",
  "cancelAnimationFrame",
];

const previousGlobals = new Map();
let activeWindow = null;

function rememberGlobal(name) {
  if (!previousGlobals.has(name)) {
    previousGlobals.set(name, {
      hadValue: Object.hasOwn(globalThis, name),
      value: globalThis[name],
    });
  }
}

function assignGlobal(name, value) {
  rememberGlobal(name);
  globalThis[name] = value;
}

function ensureCSS(window) {
  const css = window.CSS || {};
  if (typeof css.escape !== "function") {
    css.escape = (value) =>
      // Control characters are exactly what CSS.escape must escape; the rule
      // cannot apply to this polyfill.
      // biome-ignore lint/suspicious/noControlCharactersInRegex: CSS escape polyfill
      String(value).replace(/[\0-\x1f\x7f]|^-?\d|^-$|[^\w-]/g, (char, index) => {
        if (char === "\0") return "\uFFFD";
        const hex = char.codePointAt(0).toString(16);
        // biome-ignore lint/suspicious/noControlCharactersInRegex: CSS escape polyfill
        return index === 0 || /[\0-\x1f\x7f]/.test(char) ? `\\${hex} ` : `\\${char}`;
      });
  }
  return css;
}

// happy-dom holds MutationObserver callbacks only through a WeakRef
// (MutationObserverListener), so a GC pass mid-test silently kills every
// observer — enhance() cleanups stop firing after ~100ms waits. Tests swap
// WeakRef for a strong holder; cleanupDOM restores the real one.
class StrongRef {
  #target;
  constructor(target) {
    this.#target = target;
  }
  deref() {
    return this.#target;
  }
}

export function setupDOM(html = "") {
  cleanupDOM();

  assignGlobal("WeakRef", StrongRef);

  const window = new Window();
  activeWindow = window;
  window.matchMedia ??= () => ({
    matches: false,
    media: "",
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent() {
      return false;
    },
  });

  installPopoverTestStub(window);

  const globals = {
    window,
    document: window.document,
    Document: window.Document,
    DocumentFragment: window.DocumentFragment,
    HTMLElement: window.HTMLElement,
    HTMLDialogElement: window.HTMLDialogElement,
    HTMLFormElement: window.HTMLFormElement,
    Element: window.Element,
    Node: window.Node,
    Event: window.Event,
    MutationObserver: window.MutationObserver,
    CustomEvent: window.CustomEvent,
    KeyboardEvent: window.KeyboardEvent,
    MouseEvent: window.MouseEvent,
    FocusEvent: window.FocusEvent,
    CSS: ensureCSS(window),
    requestAnimationFrame: (fn) => window.setTimeout(() => fn(Date.now()), 0),
    cancelAnimationFrame: (id) => window.clearTimeout(id),
  };

  for (const [name, value] of Object.entries(globals)) {
    assignGlobal(name, value);
  }

  document.body.innerHTML = html;
  return window;
}

export function cleanupDOM() {
  for (const name of assignedGlobals) {
    if (!previousGlobals.has(name)) continue;
    const previous = previousGlobals.get(name);
    if (previous.hadValue) {
      globalThis[name] = previous.value;
    } else {
      delete globalThis[name];
    }
    previousGlobals.delete(name);
  }

  activeWindow?.happyDOM?.close();
  activeWindow = null;
}

export function nextMicrotask() {
  return Promise.resolve().then(() => Promise.resolve());
}

export async function flushMutationObserver() {
  await nextMicrotask();
}

export function click(el, options = {}) {
  el.dispatchEvent(
    new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      ...options,
    }),
  );
}

export function press(target, key, options = {}) {
  target.dispatchEvent(
    new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key,
      ...options,
    }),
  );
}

export function mockRect(el, rect) {
  const complete = {
    x: rect.x ?? rect.left ?? 0,
    y: rect.y ?? rect.top ?? 0,
    width: rect.width ?? 0,
    height: rect.height ?? 0,
  };
  complete.left = rect.left ?? complete.x;
  complete.top = rect.top ?? complete.y;
  complete.right = rect.right ?? complete.x + complete.width;
  complete.bottom = rect.bottom ?? complete.y + complete.height;

  el.getBoundingClientRect = () => complete;
  el.getClientRects = () => [complete];
  return complete;
}

export function patchDialogMethods() {
  if (typeof HTMLDialogElement === "undefined") return;

  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.show = function show() {
    this.open = true;
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close(returnValue = "") {
    if (!this.open) return;
    this.returnValue = returnValue;
    this.open = false;
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
  HTMLDialogElement.prototype.requestClose = function requestClose(returnValue = "") {
    // Mirrors the native lifecycle: a cancelable cancel event fires first and
    // the dialog only closes when it is not prevented.
    const event = new Event("cancel", { cancelable: true });
    if (!this.dispatchEvent(event)) return;
    this.close(returnValue);
  };
}
