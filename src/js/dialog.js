/*
 * Dialog — thin declarative layer over native <dialog>.
 *
 * Trigger:       <button commandfor="dialog-id" command="show-modal">
 * Close button:  <button commandfor="dialog-id" command="request-close">
 * Dialog:        <dialog id="dialog-id" data-dialog-dismissible>
 *
 * Defaults to modal showModal(). Use data-dialog-modal="false" for show().
 * Dismissible means backdrop click/light dismiss is allowed.
 *
 * View transitions (opt-in via data-dialog-view-transition):
 *   When the browser supports document.startViewTransition and the user allows
 *   motion, the dialog morphs to/from its trigger using a shared
 *   view-transition-name. Otherwise native dialog behavior remains the
 *   baseline: the dialog simply opens and closes.
 */

import enhance from "./enhance.js";

const triggerMap = new WeakMap();
const dialogMap = new WeakMap();
const DIALOG_TRIGGER_SELECTOR = "button[commandfor][command]";
const DIALOG_SELECTOR = "dialog";

function supportsDialog() {
  return (
    typeof HTMLDialogElement !== "undefined" &&
    typeof HTMLDialogElement.prototype.showModal === "function"
  );
}

function isDialog(el) {
  return typeof HTMLDialogElement !== "undefined" && el instanceof HTMLDialogElement;
}

function boolData(el, name) {
  return el.hasAttribute(name) && el.getAttribute(name) !== "false";
}

function dialogIdFor(trigger) {
  return trigger.getAttribute("commandfor") || "";
}

function dialogFor(trigger) {
  const id = dialogIdFor(trigger);
  return id ? trigger.ownerDocument.getElementById(id) : null;
}

function isModal(dialog) {
  return dialog.getAttribute("data-dialog-modal") !== "false";
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

function openDialogWithViewTransition(dialog, trigger) {
  if (!canViewTransition(dialog, trigger)) {
    openDialog(dialog, trigger);
    return;
  }

  setVtName(trigger, VT_NAME);

  const transition = dialog.ownerDocument.startViewTransition(() => {
    clearVtName(trigger);
    setVtName(dialog, VT_NAME);
    openDialog(dialog, trigger);
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

export function openDialog(dialog, trigger = null) {
  if (!isDialog(dialog) || dialog.open || !dialog.isConnected) return;

  const state = ensureDialogWired(dialog);

  state.closing = false;
  state.restoreFocusTo = trigger || document.activeElement;

  if (isModal(dialog)) {
    dialog.showModal();
  } else {
    dialog.show();
  }
}

function handleTriggerClick(event) {
  const trigger = event.currentTarget;
  const state = triggerMap.get(trigger);
  if (!state) return;

  const command = trigger.getAttribute("command").toLowerCase();

  event.preventDefault();

  if (command === "show-modal") {
    openDialogWithViewTransition(state.dialog, trigger);
    return;
  }

  if (command === "request-close") {
    requestDialogClose(state.dialog, trigger.value || "");
    return;
  }

  if (command === "close") {
    closeDialog(state.dialog, trigger.value || "");
  }
}

function handleDialogClick(event) {
  const dialog = event.currentTarget;

  if (
    isDismissible(dialog) &&
    event.target === dialog &&
    isOutsideDialog(dialog, event)
  ) {
    event.preventDefault();
    requestDialogClose(dialog);
  }
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

  if (!canViewTransition(dialog, dialogMap.get(dialog)?.restoreFocusTo)) return;

  event.preventDefault();
  closeDialog(dialog, dialogMap.get(dialog)?.returnValue || "");
}

function handleDialogClose(event) {
  const dialog = event.currentTarget;
  const state = dialogMap.get(dialog);

  clearVtName(dialog);

  if (!state) return;

  state.closing = false;
  state.returnValue = "";

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
    restoreFocusTo: null,
    returnValue: "",
  };

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
  return state;
}

function disconnectDialog(dialog) {
  const state = dialogMap.get(dialog);
  if (!state) return;

  state.controller.abort();
  dialogMap.delete(dialog);
}

function connectTrigger(trigger) {
  if (triggerMap.has(trigger)) return;

  const dialog = dialogFor(trigger);
  if (!isDialog(dialog)) return;

  ensureDialogWired(dialog);

  const controller = new AbortController();
  trigger.setAttribute("aria-controls", dialog.id);

  if (!trigger.hasAttribute("aria-haspopup") && isModal(dialog)) {
    trigger.setAttribute("aria-haspopup", "dialog");
  }

  trigger.addEventListener("click", handleTriggerClick, { signal: controller.signal });
  triggerMap.set(trigger, { dialog, controller });
}

function disconnectTrigger(trigger) {
  const state = triggerMap.get(trigger);
  if (!state) return;

  state.controller.abort();
  triggerMap.delete(trigger);
}

if (typeof document !== "undefined" && supportsDialog()) {
  enhance({
    [DIALOG_TRIGGER_SELECTOR]: (trigger) => {
      connectTrigger(trigger);
      return () => disconnectTrigger(trigger);
    },
    [DIALOG_SELECTOR]: (dialog) => {
      ensureDialogWired(dialog);
      return () => disconnectDialog(dialog);
    },
  });
}
