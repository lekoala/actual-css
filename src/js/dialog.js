/*
 * Dialog — thin declarative layer over native <dialog>.
 *
 * Trigger:       <button commandfor="dialog-id" command="show-modal">
 * Close button:  <button commandfor="dialog-id" command="request-close">
 * Dialog:        <dialog id="dialog-id" data-dialog-dismissible>
 *
 * Command semantics are explicit: show-modal calls showModal(), show calls
 * show(). data-dialog-modal still defines the default for direct openDialog()
 * calls when no command mode is forced.
 * Dismissible means backdrop click/light dismiss is allowed.
 *
 * View transitions (opt-in via data-dialog-view-transition):
 *   When the browser supports document.startViewTransition and the user allows
 *   motion, the dialog morphs to/from its trigger using a shared
 *   view-transition-name. Otherwise native dialog behavior remains the
 *   baseline: the dialog simply opens and closes.
 *
 * Browsers without native <dialog> can get a rudimentary per-element shim
 * from the optional, standalone dialog-fallback.js module; this module has
 * no dependency on it and alerts when no shim or polyfill made the target
 * controllable.
 */

import { registerCommands, targetFor } from "./command.js";
import enhance from "./enhance.js";
import { EVENTS } from "./events.js";
import { CLASSES } from "./selectors.js";

const dialogMap = new WeakMap();
const wiredDialogs = new Set();
const DIALOG_COMMANDS = ["show-modal", "show", "request-close", "close"];
const DIALOG_SELECTOR = "dialog";
const DIALOG_TITLE_SELECTOR = "[data-title], h1, h2, h3, h4, h5, h6";
const DEFAULT_UNSUPPORTED_MESSAGE =
  "This dialog cannot open because this browser does not support this feature.";
let uid = 0;

function supportsDialog() {
  return (
    typeof HTMLDialogElement !== "undefined" &&
    typeof HTMLDialogElement.prototype.showModal === "function"
  );
}
function isDialogElement(el) {
  return (
    typeof Node !== "undefined" && el?.nodeType === Node.ELEMENT_NODE && el.localName === "dialog"
  );
}

function canControlDialog(el) {
  // Optional polyfills may patch registered <dialog> elements without making
  // supportsDialog() true globally, so check the actual element before opening.
  return (
    isDialogElement(el) &&
    typeof el.show === "function" &&
    typeof el.showModal === "function" &&
    typeof el.close === "function"
  );
}

function isDialog(el) {
  return canControlDialog(el);
}

function boolData(el, name) {
  return el.hasAttribute(name) && el.getAttribute(name) !== "false";
}

function ensureId(el, prefix) {
  if (!el.id) {
    uid++;
    el.id = `${prefix}-${uid}`;
  }
  return el.id;
}

function syncDialogSemantics(dialog, modal = isModal(dialog)) {
  if (modal) {
    dialog.setAttribute("aria-modal", "true");
  } else {
    dialog.removeAttribute("aria-modal");
  }

  if (dialog.hasAttribute("aria-label") || dialog.hasAttribute("aria-labelledby")) {
    return;
  }

  const label = dialog.getAttribute("data-title")?.trim();
  if (label) {
    dialog.setAttribute("aria-label", label);
    return;
  }

  const title = dialog.querySelector(DIALOG_TITLE_SELECTOR);
  if (title) {
    dialog.setAttribute("aria-labelledby", ensureId(title, "dialog-title"));
  }
}

// Reached only when neither the optional dialog-fallback module nor an
// adopter polyfill made the target controllable on a legacy browser.
function notifyUnsupportedDialog(trigger) {
  const win = trigger.ownerDocument.defaultView;
  win?.alert?.(DEFAULT_UNSUPPORTED_MESSAGE);
}

function isModal(dialog) {
  return dialog.getAttribute("data-dialog-modal") !== "false";
}

function resolveModalMode(dialog, forcedModal = null) {
  return forcedModal == null ? isModal(dialog) : forcedModal;
}

function isModalOpen(dialog) {
  if (!dialog.open) return false;
  // :modal distinguishes a top-layer showModal() dialog from one opened via
  // show() or a bare `open` attribute in the initial HTML (never modal per
  // spec, whatever data-dialog-modal says).
  try {
    return dialog.matches(":modal");
  } catch {
    // Selector unsupported: the only way a dialog is open before we wire it
    // is the `open` attribute, which is non-modal.
    return false;
  }
}

function syncModalOpenClass(doc = document) {
  let hasOpenModal = false;

  for (const dialog of wiredDialogs) {
    const state = dialogMap.get(dialog);
    if (
      dialog.ownerDocument === doc &&
      dialog.isConnected &&
      dialog.open &&
      state?.modalOpen === true
    ) {
      hasOpenModal = true;
      break;
    }
  }

  const root = doc.documentElement;
  const wasOpen = root.classList.contains(CLASSES.modalOpen);

  if (hasOpenModal && !wasOpen) {
    const viewportWidth = doc.defaultView?.innerWidth;
    root.classList.toggle(
      CLASSES.hadScrollbar,
      Number.isFinite(viewportWidth) && viewportWidth > root.clientWidth,
    );
  } else if (!hasOpenModal) {
    root.classList.remove(CLASSES.hadScrollbar);
  }

  root.classList.toggle(CLASSES.modalOpen, hasOpenModal);
}

function isDismissible(dialog) {
  return boolData(dialog, "data-dialog-dismissible");
}

function wantsViewTransition(dialog) {
  return boolData(dialog, "data-dialog-view-transition");
}

const VT_NAME = "actual-dialog";

function supportsViewTransitions(doc = document) {
  return typeof doc.startViewTransition === "function";
}

function motionAllowed(doc = document) {
  return !doc.defaultView?.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function setVtName(target, name) {
  if (target) target.style.viewTransitionName = name;
}

function clearVtName(...targets) {
  for (const target of targets) {
    if (target) target.style.viewTransitionName = "";
  }
}

function canViewTransition(dialog, trigger) {
  const doc = dialog.ownerDocument;
  return (
    wantsViewTransition(dialog) &&
    supportsViewTransitions(doc) &&
    motionAllowed(doc) &&
    trigger?.isConnected === true
  );
}

function openDialogWithViewTransition(dialog, trigger, forcedModal = null) {
  if (!canViewTransition(dialog, trigger)) {
    openDialog(dialog, trigger, forcedModal);
    return;
  }

  setVtName(trigger, VT_NAME);

  const transition = dialog.ownerDocument.startViewTransition(() => {
    clearVtName(trigger);
    setVtName(dialog, VT_NAME);
    openDialog(dialog, trigger, forcedModal);
  });

  transition.finished.finally(() => clearVtName(dialog, trigger)).catch(() => {});
}

function isOutsideDialog(dialog, event) {
  const rect = dialog.getBoundingClientRect();

  return (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  );
}

function flashStatic(dialog) {
  const state = ensureDialogWired(dialog);

  if (state.staticTimer) {
    window.clearTimeout(state.staticTimer);
  }

  dialog.classList.remove(CLASSES.static);
  void dialog.offsetWidth;
  dialog.classList.add(CLASSES.static);

  state.staticTimer = window.setTimeout(() => {
    dialog.classList.remove(CLASSES.static);
    state.staticTimer = null;
  }, 250);
}

function finishClose(dialog, returnValue = "") {
  const state = dialogMap.get(dialog);

  if (state) {
    state.closing = false;
    state.returnValue = "";
  }

  if (dialog.open) {
    dialog.close(returnValue);
  }
}

export function closeDialog(dialog, returnValue = "") {
  if (!isDialog(dialog) || !dialog.open) return;

  const state = ensureDialogWired(dialog);
  if (state.closing) return;

  const trigger = state.restoreFocusTo;
  if (canViewTransition(dialog, trigger)) {
    state.closing = true;
    setVtName(dialog, VT_NAME);

    const transition = dialog.ownerDocument.startViewTransition(() => {
      clearVtName(dialog);
      setVtName(trigger, VT_NAME);
      dialog.close(returnValue);
    });

    transition.finished
      .finally(() => {
        state.closing = false;
        clearVtName(trigger);
      })
      .catch(() => {});
    return;
  }

  finishClose(dialog, returnValue);
}

export function requestDialogClose(dialog, returnValue = "") {
  if (!isDialog(dialog) || !dialog.open) return;

  if (typeof dialog.requestClose === "function") {
    ensureDialogWired(dialog).returnValue = returnValue;
    dialog.requestClose(returnValue);
    return;
  }

  closeDialog(dialog, returnValue);
}

export function openDialog(dialog, trigger = null, forcedModal = null) {
  if (!isDialog(dialog) || dialog.open || !dialog.isConnected) return;

  const state = ensureDialogWired(dialog);
  const modal = resolveModalMode(dialog, forcedModal);
  syncDialogSemantics(dialog, modal);

  state.closing = false;
  state.restoreFocusTo = trigger || document.activeElement;

  if (modal) {
    dialog.showModal();
    state.modalOpen = true;
  } else {
    dialog.show();
    state.modalOpen = false;
  }

  syncModalOpenClass(dialog.ownerDocument);
}

function handleDialogClick(event) {
  const dialog = event.currentTarget;

  if (event.target !== dialog || !isOutsideDialog(dialog, event)) return;

  event.preventDefault();

  if (isDismissible(dialog)) {
    requestDialogClose(dialog);
    return;
  }

  flashStatic(dialog);
}

function handleDialogSubmit(event) {
  const dialog = event.currentTarget;
  const form = event.target;

  if (!(form instanceof HTMLFormElement)) return;
  if (form.method.toLowerCase() !== "dialog") return;
  if (!canViewTransition(dialog, dialogMap.get(dialog)?.restoreFocusTo)) return;

  event.preventDefault();
  closeDialog(dialog, event.submitter?.value || "");
}

function handleDialogCancel(event) {
  const dialog = event.currentTarget;

  if (!isDismissible(dialog)) {
    event.preventDefault();
    flashStatic(dialog);
    return;
  }

  const request = new CustomEvent(EVENTS.dialogCancel, {
    bubbles: true,
    cancelable: true,
    detail: { dialog, sourceEvent: event },
  });
  if (!dialog.dispatchEvent(request)) {
    event.preventDefault();
    return;
  }

  event.preventDefault();
  closeDialog(dialog, dialogMap.get(dialog)?.returnValue || "");
}

function handleDialogClose(event) {
  const dialog = event.currentTarget;
  const state = dialogMap.get(dialog);

  clearVtName(dialog);

  if (!state) return;

  if (state.staticTimer) {
    window.clearTimeout(state.staticTimer);
    state.staticTimer = null;
  }

  dialog.classList.remove(CLASSES.static);
  state.closing = false;
  state.returnValue = "";
  state.modalOpen = false;
  syncModalOpenClass(dialog.ownerDocument);

  const restoreFocusTo = state.restoreFocusTo;
  state.restoreFocusTo = null;

  if (restoreFocusTo?.isConnected) {
    restoreFocusTo.focus();
  }
}

function ensureDialogWired(dialog) {
  if (dialogMap.has(dialog)) return dialogMap.get(dialog);

  const controller = new AbortController();
  const state = {
    controller,
    closing: false,
    modalOpen: isModalOpen(dialog),
    restoreFocusTo: null,
    returnValue: "",
    staticTimer: null,
  };

  syncDialogSemantics(dialog);

  dialog.addEventListener("click", handleDialogClick, { signal: controller.signal });
  dialog.addEventListener("submit", handleDialogSubmit, { signal: controller.signal });
  dialog.addEventListener("cancel", handleDialogCancel, { signal: controller.signal });
  dialog.addEventListener("close", handleDialogClose, { signal: controller.signal });

  // Let modern browsers know the intended native close policy. Backdrop click
  // is still handled above so animation remains consistent across browsers.
  if ("closedBy" in dialog) {
    // Keep native Esc/back close requests, but handle backdrop clicks ourselves
    // so animated light dismiss behaves consistently across browsers.
    dialog.closedBy = "closerequest";
  }

  dialogMap.set(dialog, state);
  wiredDialogs.add(dialog);
  syncModalOpenClass(dialog.ownerDocument);
  return state;
}

function connectDialog(dialog) {
  ensureDialogWired(dialog);
}

function disconnectDialog(dialog) {
  const state = dialogMap.get(dialog);
  if (!state) return;

  if (state.staticTimer) {
    window.clearTimeout(state.staticTimer);
  }

  state.controller.abort();
  dialog.classList.remove(CLASSES.static);
  state.modalOpen = false;
  dialogMap.delete(dialog);
  wiredDialogs.delete(dialog);
  syncModalOpenClass(dialog.ownerDocument);
}

registerCommands(DIALOG_COMMANDS, {
  resolve: (trigger) => {
    const dialog = targetFor(trigger);
    return isDialogElement(dialog) ? dialog : null;
  },
  prepare: (trigger, dialog, command) => {
    if (isDialog(dialog)) {
      ensureDialogWired(dialog);
    }

    trigger.setAttribute("aria-controls", dialog.id);

    if (
      !trigger.hasAttribute("aria-haspopup") &&
      (command === "show-modal" || command === "show")
    ) {
      trigger.setAttribute("aria-haspopup", "dialog");
    }
  },
  handle: (event, trigger, dialog, command) => {
    event.preventDefault();

    if (!isDialog(dialog)) {
      if (command === "show-modal" || command === "show") {
        notifyUnsupportedDialog(trigger);
      }
      return;
    }

    if (command === "show-modal" || command === "show") {
      openDialogWithViewTransition(dialog, trigger, command === "show-modal");
      return;
    }

    if (command === "request-close") {
      requestDialogClose(dialog, trigger.value || "");
      return;
    }

    if (command === "close") {
      closeDialog(dialog, trigger.value || "");
    }
  },
});

if (supportsDialog()) {
  enhance({
    [DIALOG_SELECTOR]: (dialog) => {
      connectDialog(dialog);
      return () => disconnectDialog(dialog);
    },
  });
}
