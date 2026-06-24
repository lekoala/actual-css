/*
 * Dialog — thin declarative layer over native <dialog>.
 *
 * Trigger:       <button data-dialog="dialog-id">
 * Close button:  <button data-dialog-close>
 * Dialog:        <dialog id="dialog-id" data-dialog-dismissible>
 *
 * Defaults to modal showModal(). Use data-dialog-modal="false" for show().
 * Dismissible means backdrop click/light dismiss is allowed.
 *
 * Animation:
 *   Closing is routed through .is-closing when an exit animation/transition
 *   is present. The actual dialog.close() call is delayed until the animation
 *   finishes, so CSS can animate the dialog out before [open] is removed.
 *
 * View transitions (opt-in via data-dialog-view-transition):
 *   When the browser supports document.startViewTransition and the user allows
 *   motion, the dialog morphs to/from its trigger using a shared
 *   view-transition-name. The fade/scale transition above remains the
 *   progressive-enhancement baseline; view transitions replace it only when
 *   a trigger pair exists and the gate passes.
 */

import enhance from "./enhance.js";

const triggerMap = new WeakMap();
const dialogMap = new WeakMap();
const DIALOG_TRIGGER_SELECTOR = "button[data-dialog]";
const DIALOG_SELECTOR = "dialog";
const CLOSE_SELECTOR = "[data-dialog-close]";

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
  return trigger.getAttribute("data-dialog") || trigger.getAttribute("aria-controls") || "";
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

function shouldAnimate(dialog) {
  return dialog.getAttribute("data-dialog-animate") !== "false";
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

  dialog.ownerDocument.startViewTransition(() => {
    clearVtName(trigger);
    setVtName(dialog, VT_NAME);
    openDialog(dialog, trigger);
  });
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

function refreshScrollbarVar(doc = document) {
  const root = doc.documentElement;
  const width = Math.max(0, window.innerWidth - root.clientWidth);
  root.style.setProperty("--scrollbar-width", `${width}px`);
}

function toMs(value) {
  value = value.trim();
  if (!value) return 0;
  if (value.endsWith("ms")) return Number.parseFloat(value) || 0;
  if (value.endsWith("s")) return (Number.parseFloat(value) || 0) * 1000;
  return 0;
}

function timeList(value) {
  return value.split(",").map(toMs);
}

function maxPairedTime(durations, delays) {
  const max = Math.max(durations.length, delays.length);
  let result = 0;

  for (let i = 0; i < max; i++) {
    const duration = durations[i % durations.length] || 0;
    const delay = delays[i % delays.length] || 0;
    result = Math.max(result, duration + delay);
  }

  return result;
}

function maxAnimationTimeForStyle(style) {
  return Math.max(
    maxPairedTime(timeList(style.transitionDuration), timeList(style.transitionDelay)),
    maxPairedTime(timeList(style.animationDuration), timeList(style.animationDelay)),
  );
}

function getAnimationTime(dialog) {
  const styles = [getComputedStyle(dialog)];

  try {
    styles.push(getComputedStyle(dialog, "::backdrop"));
  } catch {
    // Some DOM/CSS implementations may not expose pseudo-element styles.
  }

  return Math.max(...styles.map(maxAnimationTimeForStyle));
}

function finishClose(dialog, returnValue = "") {
  const state = dialogMap.get(dialog);

  if (state) {
    state.closing = false;
    state.closeTimer = null;
  }

  dialog.classList.remove("is-closing");

  if (dialog.open) {
    dialog.close(returnValue);
  }
}

export function closeDialog(dialog, returnValue = "") {
  if (!isDialog(dialog) || !dialog.open) return;

  const state = ensureDialogWired(dialog);
  if (state.closing) return;

  if (!shouldAnimate(dialog)) {
    finishClose(dialog, returnValue);
    return;
  }

  const trigger = state.restoreFocusTo;
  if (canViewTransition(dialog, trigger)) {
    state.closing = true;
    setVtName(dialog, VT_NAME);

    const transition = dialog.ownerDocument.startViewTransition(() => {
      clearVtName(dialog);
      setVtName(trigger, VT_NAME);
      dialog.close(returnValue);
    });

    transition.finished.finally(() => clearVtName(trigger));
    return;
  }

  dialog.classList.add("is-closing");

  const animationTime = getAnimationTime(dialog);
  if (animationTime <= 0) {
    finishClose(dialog, returnValue);
    return;
  }

  state.closing = true;
  state.closeTimer = window.setTimeout(() => {
    finishClose(dialog, returnValue);
  }, animationTime + 50);

  const done = () => {
    if (state.closeTimer) {
      window.clearTimeout(state.closeTimer);
    }
    finishClose(dialog, returnValue);
  };

  dialog.addEventListener("animationend", done, { once: true });
  dialog.addEventListener("transitionend", done, { once: true });
}

export function requestDialogClose(dialog, returnValue = "") {
  if (!isDialog(dialog) || !dialog.open) return;

  if (typeof dialog.requestClose === "function") {
    dialog.requestClose(returnValue);
    return;
  }

  closeDialog(dialog, returnValue);
}

export function openDialog(dialog, trigger = null) {
  if (!isDialog(dialog) || dialog.open || !dialog.isConnected) return;

  const state = ensureDialogWired(dialog);

  if (state.closeTimer) {
    window.clearTimeout(state.closeTimer);
    state.closeTimer = null;
  }

  state.closing = false;
  state.restoreFocusTo = trigger || document.activeElement;
  dialog.classList.remove("is-closing");

  if (isModal(dialog)) {
    refreshScrollbarVar(dialog.ownerDocument);
    dialog.showModal();
  } else {
    dialog.show();
  }
}

function handleTriggerClick(event) {
  const trigger = event.currentTarget;
  const state = triggerMap.get(trigger);
  if (!state) return;

  event.preventDefault();

  if (boolData(trigger, "data-dialog-close")) {
    requestDialogClose(state.dialog, trigger.value || "");
    return;
  }

  openDialogWithViewTransition(state.dialog, trigger);
}

function handleDialogClick(event) {
  const dialog = event.currentTarget;
  const closeButton = event.target.closest?.(CLOSE_SELECTOR);

  if (closeButton && dialog.contains(closeButton)) {
    event.preventDefault();
    requestDialogClose(dialog, closeButton.value || "");
    return;
  }

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
  if (!shouldAnimate(dialog)) return;

  event.preventDefault();
  closeDialog(dialog, event.submitter?.value || "");
}

function handleDialogCancel(event) {
  const dialog = event.currentTarget;

  if (!shouldAnimate(dialog)) return;

  event.preventDefault();
  closeDialog(dialog);
}

function handleDialogCommand(event) {
  if (event.command !== "show-modal") return;

  const dialog = event.currentTarget;
  if (!wantsViewTransition(dialog)) return;

  const trigger = event.invoker || event.sourceEvent?.target;
  if (!canViewTransition(dialog, trigger)) return;

  event.preventDefault();
  openDialogWithViewTransition(dialog, trigger);
}

function handleDialogClose(event) {
  const dialog = event.currentTarget;
  const state = dialogMap.get(dialog);

  dialog.classList.remove("is-closing");
  clearVtName(dialog);

  if (!state) return;

  if (state.closeTimer) {
    window.clearTimeout(state.closeTimer);
    state.closeTimer = null;
  }

  state.closing = false;

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
    closeTimer: null,
    restoreFocusTo: null,
  };

  dialog.addEventListener("click", handleDialogClick, { signal: controller.signal });
  dialog.addEventListener("submit", handleDialogSubmit, { signal: controller.signal });
  dialog.addEventListener("cancel", handleDialogCancel, { signal: controller.signal });
  dialog.addEventListener("command", handleDialogCommand, { signal: controller.signal });
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

  if (state.closeTimer) {
    window.clearTimeout(state.closeTimer);
  }

  state.controller.abort();
  dialog.classList.remove("is-closing");
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
