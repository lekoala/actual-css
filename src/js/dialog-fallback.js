/*
 * Dialog fallback — minimal per-element shim for browsers without native
 * <dialog> support (Safari <= 15.3, Firefox <= 97, both below Baseline 2023).
 *
 * Standalone side-effect module: the default runtime imports it, a custom
 * build opts out by omitting it — dialog.js has no dependency on this file
 * and falls back to its acknowledgement alert without it. On supporting
 * browsers importing this module registers nothing.
 *
 * Not a polyfill: no top layer, no focus trap, no inert background. It only
 * provides show()/showModal()/close() and an `open` property so dialog.js can
 * run its normal wiring — backdrop click, Escape cancel, close events, focus
 * restore, and the scroll lock all come from that wiring, not from here.
 *
 * Presentation lives in dialog-fallback.css, keyed on the classes written
 * below. The simulated backdrop is split in two there: a spread box-shadow
 * for the dimming, and a transparent ::before covering the viewport for
 * hit-testing — clicks on it target the dialog element outside its own box,
 * which dialog.js already treats as a backdrop click, and it blocks pointer
 * interaction with the page behind the modal.
 *
 * An adopter-provided polyfill (e.g. dialog-polyfill) still wins: elements it
 * already patched expose showModal() and are left untouched.
 */

import { targetFor } from "./command.js";
import enhance from "./enhance.js";
import { CLASSES } from "./selectors.js";

function supportsDialog() {
  return (
    typeof HTMLDialogElement !== "undefined" &&
    typeof HTMLDialogElement.prototype.showModal === "function"
  );
}

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

if (typeof document !== "undefined" && !supportsDialog()) {
  enhance({
    dialog: (el) => {
      shimDialog(el);
    },
  });

  // A dialog inserted right before its trigger's click may not be scanned by
  // enhance() yet, so shim command targets in capture phase too — before the
  // delegated command routing resolves them.
  document.addEventListener(
    "click",
    (event) => {
      const trigger = event.target?.closest?.("button[commandfor][command]");
      if (!trigger) return;
      const dialog = targetFor(trigger);
      if (dialog?.localName === "dialog") {
        shimDialog(dialog);
      }
    },
    true,
  );
}
