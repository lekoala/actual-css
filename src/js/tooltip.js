/*
 * Tooltip — supplemental label shown on hover and focus.
 *
 * Shorthand:  <button data-tooltip="Help text" data-tooltip-placement="right">
 * Explicit:   <button data-tooltip aria-describedby="tooltip-id">
 *             <div role="tooltip" id="tooltip-id" hidden>Help <strong>text</strong></div>
 * Options:    data-tooltip-click toggles on click instead of hover/focus.
 *             data-tooltip-visible keeps the tooltip visible.
 *
 * Discovery:  [data-tooltip] only. An empty data-tooltip marks an explicit
 *             tooltip that points at an aria-describedby target; a non-empty
 *             data-tooltip generates the tooltip element lazily.
 *             Plain aria-describedby (form help, error text) is never
 *             treated as a tooltip trigger.
 *
 * Sharing:    an explicit tooltip may be referenced by several triggers. The
 *             tooltip element is wired once; each trigger only registers
 *             itself. Positional tracking runs only while the tip is visible,
 *             and all wiring is torn down when the last trigger leaves the DOM.
 *
 * Lazy:       tooltip elements are created (shorthand) or wired (explicit) on
 *             first mouseover / focusin. No page-load scan, no DOM overhead
 *             for tooltips that are never triggered. AJAX-loaded triggers
 *             work automatically via bubbling delegated listeners.
 *
 * Show:       hover + focus (150ms delay), click toggle, or always visible
 * Hide:       blur, pointer leave, Escape
 *
 * Transport:  the top layer, via popover="manual", written by the runtime on
 *             every tip it manages. A .tooltip[popover] with no data-tooltip
 *             trigger pointing at it is never reached from here and stays the
 *             application's own to drive.
 */

import { autoUpdate, reposition } from "@lekoala/floating";
import enhance from "./enhance.js";
import { registerEscapeDismissal } from "./escape.js";
import { CLASSES } from "./selectors.js";

const SHOW_DELAY_MS = 150;
const HIDE_DELAY_MS = 100;

/**
 * @typedef {object} TooltipState
 * @property {Set<Element>} refs Triggers that currently reference this tip.
 * @property {Element | null} activeRef Trigger that last showed this tip.
 * @property {AbortController} controller Tip-level event listener cleanup.
 * @property {(() => void) | null} stopTracking Floating-position cleanup while visible.
 * @property {(() => void) | null} unregisterEscape Escape-stack cleanup while visible and dismissable.
 * @property {Element | null} escapeRef Trigger represented by the current Escape-stack entry.
 * @property {boolean} generated True when the tip was created from data-tooltip text.
 * @property {boolean} visible True while the tip is promoted to the top layer.
 * @property {ReturnType<typeof setTimeout> | null} timer Pending delayed show.
 * @property {ReturnType<typeof setTimeout> | null} hideTimer Pending delayed hide.
 * @property {boolean} hovered Pointer is over the active trigger.
 * @property {boolean} focused The active trigger has keyboard focus.
 * @property {boolean} overTip Pointer is over the tooltip.
 */

let uid = 0;
const triggerStates = new WeakMap(); // trigger -> { tip, cleanup }
/** @type {WeakMap<Element, TooltipState>} */
const tipStates = new WeakMap(); // tip -> { refs, activeRef, controller, stopTracking, generated, visible, timer }

/*
 * Transport, the same shape surface.js uses and for the same reason: the
 * platform promotes the tip to the top layer and does nothing else, leaving
 * the hover/focus/click policy, the show delays and the Escape ordering here
 * untouched. showPopover/hidePopover throw on an out-of-order call, which the
 * state below should already have excluded — the try/catch is there so a
 * surprising DOM does not take the lifecycle down with it.
 */
function showTransport(tip) {
  try {
    tip.showPopover();
    return true;
  } catch {
    return false;
  }
}

function hideTransport(tip) {
  try {
    tip.hidePopover();
  } catch {
    /* Already closed or detached; nothing left to hide. */
  }
}

/*
 * [hidden] stops being the runtime's state here and goes back to what the
 * author wrote: the state before enhancement. Wiring is lazy, so an explicit
 * tip that is never hovered keeps it for the whole life of the page — which
 * is why .tooltip[hidden] has to stay in the CSS. The runtime strips it only
 * at the moment it takes the lifecycle over, because an author declaration
 * outranks the platform's own hidden state for a closed popover.
 */
function prepareTip(tip) {
  tip.style.position = "fixed";
  tip.removeAttribute("hidden");
  tip.setAttribute("popover", "manual");
}

/** True while the tip is promoted. The runtime's state, not :popover-open. */
export function isTooltipVisible(tip) {
  return tipStates.get(tip)?.visible === true;
}

function placementFor(ref) {
  return ref?.getAttribute("data-tooltip-placement") || "top";
}

function hasOption(trigger, name) {
  const value = trigger?.getAttribute(name);
  return value !== null && value.toLowerCase() !== "false";
}

function isClickTrigger(trigger) {
  return hasOption(trigger, "data-tooltip-click");
}

function isAlwaysVisible(trigger) {
  return hasOption(trigger, "data-tooltip-visible");
}

function describedByIds(trigger) {
  return (trigger.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean);
}

function addDescription(trigger, id) {
  const ids = describedByIds(trigger);
  if (ids.includes(id)) return false;
  trigger.setAttribute("aria-describedby", [...ids, id].join(" "));
  return true;
}

function removeDescription(trigger, id) {
  const ids = describedByIds(trigger).filter((candidate) => candidate !== id);
  if (ids.length) {
    trigger.setAttribute("aria-describedby", ids.join(" "));
  } else {
    trigger.removeAttribute("aria-describedby");
  }
}

function explicitTipFor(trigger) {
  const doc = trigger.ownerDocument;
  for (const id of describedByIds(trigger)) {
    const candidate = doc.getElementById(id);
    if (candidate?.getAttribute("role") === "tooltip") return candidate;
  }
  return null;
}

function nextTooltipId(doc) {
  let id;
  do {
    uid++;
    id = `tooltip-${uid}`;
  } while (doc.getElementById(id));
  return id;
}

function repositionTip(ref, tip) {
  return reposition(ref, tip, {
    placement: placementFor(ref),
    distance: 6,
    flip: true,
    shift: true,
  });
}

function updateTrackedTip(tip, state) {
  const ref = state.activeRef;
  if (!ref) return;

  // Two separate notions, deliberately: `pinned` is the author's policy, and
  // state.visible is what is actually rendered. A pinned tip is not always
  // shown — it goes down whenever its trigger leaves the positioning
  // boundary, and has to come back up before it can be measured again, since
  // a closed popover has no box to position.
  const pinned = isAlwaysVisible(ref);
  if (pinned && !state.visible && showTransport(tip)) state.visible = true;
  if (!state.visible || repositionTip(ref, tip)) {
    syncEscapeDismissal(tip, state);
    return;
  }

  if (pinned) {
    state.visible = false;
    hideTransport(tip);
  } else {
    hideTip(tip, true);
  }
}

function startTracking(tip, state) {
  if (state.stopTracking) return;

  state.stopTracking = autoUpdate(state.activeRef, tip, () => updateTrackedTip(tip, state));
}

function stopTracking(state) {
  state?.stopTracking?.();
  if (state) state.stopTracking = null;
}

function syncEscapeDismissal(tip, state) {
  const ref = state.activeRef;
  const dismissable = state.visible && !isAlwaysVisible(ref);
  // Position tracking calls this after every successful update. Preserve the
  // current entry so a scroll/resize tick cannot reorder the LIFO stack.
  if (dismissable && state.unregisterEscape && state.escapeRef === ref) return;

  state.unregisterEscape?.();
  state.unregisterEscape = null;
  state.escapeRef = null;
  if (!dismissable) return;

  state.unregisterEscape = registerEscapeDismissal(tip, () => hideTip(tip, true));
  state.escapeRef = ref;
}

function hideTip(tip, force = false) {
  const state = tipStates.get(tip);
  if (!force && isAlwaysVisible(state?.activeRef)) return;
  if (state?.timer) {
    clearTimeout(state.timer);
    state.timer = null;
  }
  if (state?.hideTimer) {
    clearTimeout(state.hideTimer);
    state.hideTimer = null;
  }
  if (state) state.visible = false;
  hideTransport(tip);
  state?.unregisterEscape?.();
  if (state) {
    state.unregisterEscape = null;
    state.escapeRef = null;
  }
  stopTracking(state);
}

function clearHide(tip) {
  const state = tipStates.get(tip);
  if (!state?.hideTimer) return;
  clearTimeout(state.hideTimer);
  state.hideTimer = null;
}

function scheduleHide(tip) {
  const state = tipStates.get(tip);
  if (!state) return;
  if (isClickTrigger(state.activeRef) || isAlwaysVisible(state.activeRef)) return;
  if (state.hovered || state.focused || state.overTip) return;
  if (state.hideTimer) clearTimeout(state.hideTimer);
  state.hideTimer = setTimeout(() => {
    state.hideTimer = null;
    if (!state.hovered && !state.focused && !state.overTip) hideTip(tip);
  }, HIDE_DELAY_MS);
}

// Tip-level wiring happens once per tooltip element, even when an explicit
// tooltip is shared by several triggers. activeRef is the trigger that last
// showed the tip, so reposition follows the right reference.
function wireTip(tip, options = {}) {
  let state = tipStates.get(tip);
  if (state) return state;

  const controller = new AbortController();
  state = {
    refs: new Set(),
    activeRef: null,
    controller,
    stopTracking: null,
    unregisterEscape: null,
    escapeRef: null,
    generated: options.generated === true,
    visible: false,
    timer: null,
    hideTimer: null,
    hovered: false,
    focused: false,
    overTip: false,
  };

  tip.addEventListener(
    "mouseenter",
    () => {
      state.overTip = true;
      clearHide(tip);
    },
    { signal: controller.signal },
  );
  tip.addEventListener(
    "mouseleave",
    () => {
      state.overTip = false;
      scheduleHide(tip);
    },
    { signal: controller.signal },
  );

  tipStates.set(tip, state);
  return state;
}

function ensureTip(trigger) {
  const existing = triggerStates.get(trigger);
  if (existing) return existing.tip;

  let tip;
  let generated = false;
  let descriptionAdded = false;
  const text = trigger.getAttribute("data-tooltip");
  const doc = trigger.ownerDocument;

  // shorthand: data-tooltip="text" → create element lazily
  if (text) {
    tip = doc.createElement("div");
    tip.className = CLASSES.tooltip;
    tip.role = "tooltip";
    tip.id = nextTooltipId(doc);
    tip.textContent = text;
    generated = true;

    /*
     * A generated tip is Actual's to place, so the placement has to be
     * structurally neutral — not trigger.after(). Structural pseudo-classes
     * are DOM-based and position: fixed does not exempt a generated sibling
     * from :last-child, so it would take `.join > :last-child` from the
     * trigger and drop the group's trailing corner. The shorthand therefore
     * promises no inheritance; authors who need a local theme, density or
     * custom property use the explicit form, which stays where they wrote it.
     *
     * The dialog hop is not geometry any more — the top layer handles that.
     * It is inertness: a modal dialog inerts the rest of the document, and
     * promotion does not lift an element out of that, because inertness is
     * computed on the DOM and not on paint order.
     */
    const parent = trigger.closest("dialog") || doc.body;
    parent.appendChild(tip);
    prepareTip(tip);
    descriptionAdded = addDescription(trigger, tip.id);
  }

  // explicit: data-tooltip (empty) + aria-describedby → find existing element
  if (!tip) {
    tip = explicitTipFor(trigger);
    if (!tip) return null;
    // Wire the shared tip only on first retain. A later trigger must not
    // re-hide a tooltip that is currently visible for another.
    // It is not moved: an explicit tip is author-placed, so it keeps every
    // scope that reaches it by inheritance.
    if (!tipStates.has(tip)) prepareTip(tip);
  }

  const state = wireTip(tip, { generated });
  state.refs.add(trigger);

  const triggerController = new AbortController();
  trigger.addEventListener(
    "mouseleave",
    () => {
      state.hovered = false;
      scheduleHide(tip);
    },
    { signal: triggerController.signal },
  );
  trigger.addEventListener(
    "blur",
    () => {
      state.focused = false;
      scheduleHide(tip);
    },
    { signal: triggerController.signal },
  );

  const cleanup = () => {
    triggerController.abort();
    triggerStates.delete(trigger);
    if (descriptionAdded) removeDescription(trigger, tip.id);

    state.refs.delete(trigger);
    if (state.activeRef === trigger) {
      hideTip(tip, true);
      state.activeRef = null;
    }
    // Other triggers still share this tooltip: keep the tip wiring alive.
    if (state.refs.size > 0) return;

    hideTip(tip, true);
    state.controller.abort();
    stopTracking(state);
    tipStates.delete(tip);
    // An explicit tip is left exactly where the author wrote it, closed.
    if (state.generated) tip.remove();
  };

  triggerStates.set(trigger, { tip, cleanup });
  return tip;
}

function cleanupTrigger(trigger) {
  // The enhancement runtime owns the root-membership decision; a trigger may
  // still be connected after moving beyond that lifecycle boundary.
  triggerStates.get(trigger)?.cleanup?.();
}

function show(tip, ref, immediate = false) {
  const state = tipStates.get(tip);
  if (!state) return;

  state.activeRef = ref;
  syncEscapeDismissal(tip, state);
  clearHide(tip);
  if (state.timer) clearTimeout(state.timer);
  const reveal = () => {
    state.timer = null;
    if (!state.visible) {
      if (!showTransport(tip)) return;
      state.visible = true;
    }
    startTracking(tip, state);
    updateTrackedTip(tip, state);
  };

  if (immediate) reveal();
  else state.timer = setTimeout(reveal, SHOW_DELAY_MS);
}

// ── Delegated discovery (mouseover + focusin bubble) ───

const SEL = "[data-tooltip]";

function handleTriggerIntent(e) {
  const trigger = e.target.closest?.(SEL);
  if (!trigger) return;
  if (isClickTrigger(trigger) || isAlwaysVisible(trigger)) return;
  if (
    e.type === "mouseover" &&
    e.relatedTarget instanceof Node &&
    trigger.contains(e.relatedTarget)
  )
    return;

  const tip = ensureTip(trigger);
  if (!tip) return;

  const state = tipStates.get(tip);
  if (e.type === "focusin") state.focused = true;
  else state.hovered = true;
  show(tip, trigger);
}

function handleTriggerClick(e) {
  const trigger = e.target.closest?.(SEL);
  if (!trigger || !isClickTrigger(trigger) || isAlwaysVisible(trigger)) return;

  const tip = ensureTip(trigger);
  if (!tip) return;

  e.preventDefault();
  if (isTooltipVisible(tip)) hideTip(tip, true);
  else show(tip, trigger, true);
}

// Delegated discovery listeners run at import time; keep SSR imports inert.
if (typeof document !== "undefined") {
  document.addEventListener("mouseover", handleTriggerIntent);
  document.addEventListener("focusin", handleTriggerIntent);
  document.addEventListener("click", handleTriggerClick);

  enhance({
    [SEL]: (trigger) => {
      // Ordinary and click-triggered tooltips stay lazy. The always-visible
      // option necessarily opts into eager creation/wiring.
      if (isAlwaysVisible(trigger)) {
        const tip = ensureTip(trigger);
        if (tip) show(tip, trigger, true);
      }
      return () => cleanupTrigger(trigger);
    },
  });
}
