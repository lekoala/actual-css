/*
 * Dialog fallback — minimal per-element shim for browsers without native
 * <dialog> support (Safari <= 15.3, Firefox <= 97, both below Baseline 2023).
 *
 * Not a polyfill: no top layer, no focus trap, no inert background. It only
 * provides show()/showModal()/close() and an `open` property so dialog.js can
 * run its normal wiring — backdrop click, Escape cancel, close events, focus
 * restore, and the scroll lock all come from that wiring, not from here.
 *
 * Presentation lives in the legacy @supports block of reset.css, keyed on the
 * classes written below. The simulated backdrop is a ::before pseudo-element
 * covering the viewport: clicks on it target the dialog element outside its
 * own box, which dialog.js already treats as a backdrop click, and it blocks
 * pointer interaction with the page behind the modal.
 *
 * An adopter-provided polyfill (e.g. dialog-polyfill) still wins: elements it
 * already patched expose showModal() and are left untouched.
 */

import { CLASSES } from "./selectors.js";

function focusInitial(dialog) {
  const target = dialog.querySelector("[autofocus]") || dialog;
  if (target === dialog && !dialog.hasAttribute("tabindex")) {
    dialog.setAttribute("tabindex", "-1");
  }
  target.focus?.();
}

/**
 * Patch one dialog element with rudimentary show/showModal/close support.
 * No-op when the element is already controllable (native or polyfilled).
 *
 * @param {HTMLElement} dialog A <dialog> element.
 */
export default function shimDialog(dialog) {
  if (
    typeof dialog.show === "function" &&
    typeof dialog.showModal === "function" &&
    typeof dialog.close === "function"
  ) {
    return;
  }

  const doc = dialog.ownerDocument;
  let escController = null;

  function stopEscapeListener() {
    escController?.abort();
    escController = null;
  }

  function handleEscape(event) {
    if (event.key !== "Escape") return;
    event.preventDefault();
    const cancel = new Event("cancel", { cancelable: true });
    // dialog.js always claims the cancel event and decides itself whether to
    // close; only an unwired dialog falls through to the direct close.
    if (dialog.dispatchEvent(cancel)) {
      dialog.close();
    }
  }

  function open(modal) {
    if (dialog.open) return;
    dialog.setAttribute("open", "");
    dialog.classList.toggle(CLASSES.fallbackModal, modal);
    if (modal) {
      escController = new AbortController();
      doc.addEventListener("keydown", handleEscape, { signal: escController.signal });
    }
    focusInitial(dialog);
  }

  Object.defineProperty(dialog, "open", {
    configurable: true,
    get() {
      return this.hasAttribute("open");
    },
    set(value) {
      this.toggleAttribute("open", Boolean(value));
    },
  });

  dialog.returnValue = "";
  dialog.classList.add(CLASSES.dialogFallback);
  dialog.show = () => open(false);
  dialog.showModal = () => open(true);
  dialog.close = (returnValue = "") => {
    if (!dialog.open) return;
    stopEscapeListener();
    dialog.returnValue = returnValue;
    dialog.removeAttribute("open");
    dialog.classList.remove(CLASSES.fallbackModal);
    dialog.dispatchEvent(new Event("close"));
  };
}
