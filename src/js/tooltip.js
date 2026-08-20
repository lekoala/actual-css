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
 */

import enhance from "./enhance.js";
import { registerEscapeDismissal } from "./escape.js";
import { autoUpdate, reposition } from "./floating.js";
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
 * @property {{ parent: Node, next: ChildNode | null } | null} mount Original DOM position for explicit tips moved into a dialog/body root.
 * @property {ReturnType<typeof setTimeout> | null} timer Pending delayed show.
 * @property {ReturnType<typeof setTimeout> | null} hideTimer Pending delayed hide.
 * @property {boolean} hovered Pointer is over the active trigger.
 * @property {boolean} focused The active trigger has keyboard focus.
 * @property {boolean} overTip Pointer is over the tooltip.
 */

let uid = 0;
const triggerStates = new WeakMap(); // trigger -> { tip, cleanup }
/** @type {WeakMap<Element, TooltipState>} */
const tipStates = new WeakMap(); // tip -> { refs, activeRef, controller, stopTracking, generated, mount, timer }

function mountTip(tip, trigger) {
  const root = trigger.closest("dialog") || trigger.ownerDocument.body;
  const parent = tip.parentNode;
  if (!root || !parent || parent === root) return null;

  const mount = { parent, next: tip.nextSibling };
  root.append(tip);
  return mount;
}

function restoreTip(tip, state) {
  const mount = state.mount;
  if (!mount) return;

  if (mount.parent.isConnected) {
    const next = mount.next?.parentNode === mount.parent ? mount.next : null;
    mount.parent.insertBefore(tip, next);
  } else {
    tip.remove();
  }
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

  const alwaysVisible = isAlwaysVisible(ref);
  // Reveal before measuring: an always-visible tooltip may currently be
  // hidden because its trigger was outside the positioning boundary.
  if (alwaysVisible) tip.hidden = false;
  if (tip.hidden || repositionTip(ref, tip)) {
    syncEscapeDismissal(tip, state);
    return;
  }

  if (alwaysVisible) tip.hidden = true;
  else hideTip(tip, true);
}

function startTracking(tip, state) {
  if (state.stopTracking) return;

  state.stopTracking = autoUpdate(tip, () => updateTrackedTip(tip, state));
}

function stopTracking(state) {
  state?.stopTracking?.();
  if (state) state.stopTracking = null;
}

function syncEscapeDismissal(tip, state) {
  const ref = state.activeRef;
  const dismissable = !tip.hidden && !isAlwaysVisible(ref);
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
  tip.hidden = true;
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
    mount: options.mount || null,
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
  let mount = null;
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
    tip.hidden = true;
    tip.style.position = "fixed";
    generated = true;

    const parent = trigger.closest("dialog") || doc.body;
    parent.appendChild(tip);
    descriptionAdded = addDescription(trigger, tip.id);
  }

  // explicit: data-tooltip (empty) + aria-describedby → find existing element
  if (!tip) {
    tip = explicitTipFor(trigger);
    if (!tip) return null;
    // Wire and mount the shared tip only on first retain. A later trigger
    // must not re-hide a tooltip that is currently visible for another.
    if (!tipStates.has(tip)) {
      tip.hidden = true;
      tip.style.position = "fixed";
      mount = mountTip(tip, trigger);
    }
  }

  const state = wireTip(tip, { generated, mount });
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
    if (state.generated) tip.remove();
    else restoreTip(tip, state);
  };

  triggerStates.set(trigger, { tip, cleanup });
  return tip;
}

function cleanupTrigger(trigger) {
  if (trigger.isConnected) return;
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
    tip.hidden = false;
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
  if (tip.hidden) show(tip, trigger, true);
  else hideTip(tip, true);
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
