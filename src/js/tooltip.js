/*
 * Tooltip — supplemental label shown on hover and focus.
 *
 * Shorthand:  <button data-tooltip="Help text" data-tooltip-placement="right">
 * Explicit:   <button data-tooltip aria-describedby="tooltip-id">
 *             <div role="tooltip" id="tooltip-id" hidden>Help text</div>
 *
 * Discovery:  [data-tooltip] only. An empty data-tooltip marks an explicit
 *             tooltip that points at an aria-describedby target; a non-empty
 *             data-tooltip generates the tooltip element lazily.
 *             Plain aria-describedby (form help, error text) is never
 *             treated as a tooltip trigger.
 *
 * Sharing:    an explicit tooltip may be referenced by several triggers. The
 *             tooltip element is wired once (floating listeners + tracking);
 *             each trigger only registers itself and the wiring is torn down
 *             when the last trigger leaves the DOM.
 *
 * Lazy:       tooltip elements are created (shorthand) or wired (explicit) on
 *             first mouseover / focusin. No page-load scan, no DOM overhead
 *             for tooltips that are never triggered. AJAX-loaded triggers
 *             work automatically via bubbling delegated listeners.
 *
 * Show:       hover + focus (150ms delay)
 * Hide:       blur, pointer leave, Escape
 */

import { track, reposition } from "./floating.js";
import { EVENTS } from "./events.js";
import enhance from "./enhance.js";

const SHOW_DELAY_MS = 150;
const HIDE_DELAY_MS = 100;

/**
 * @typedef {object} TooltipState
 * @property {Set<Element>} refs Triggers that currently reference this tip.
 * @property {Element | null} activeRef Trigger that last showed this tip.
 * @property {AbortController} controller Tip-level event listener cleanup.
 * @property {() => void} untrack Floating-position cleanup.
 * @property {boolean} generated True when the tip was created from data-tooltip text.
 * @property {{ parent: Node, next: ChildNode | null } | null} mount Original DOM position for explicit tips moved into a dialog/body root.
 * @property {ReturnType<typeof setTimeout> | null} timer Pending delayed show.
 * @property {ReturnType<typeof setTimeout> | null} hideTimer Pending delayed hide.
 * @property {boolean} overRef Pointer is over the active trigger.
 * @property {boolean} overTip Pointer is over the tooltip.
 */

let uid = 0;
const triggerStates = new WeakMap(); // trigger -> { tip, cleanup } | { tip: null }
/** @type {WeakMap<Element, TooltipState>} */
const tipStates = new WeakMap(); // tip -> { refs, activeRef, controller, untrack, generated, mount, timer }

function mountTip(tip, trigger) {
  const root = trigger.closest("dialog") || document.body;
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

function repositionTip(ref, tip) {
  reposition(ref, tip, {
    placement: placementFor(ref),
    distance: 6,
    flip: true,
    shift: true,
  });
}

function hideTip(tip) {
  const state = tipStates.get(tip);
  if (state?.timer) {
    clearTimeout(state.timer);
    state.timer = null;
  }
  if (state?.hideTimer) {
    clearTimeout(state.hideTimer);
    state.hideTimer = null;
  }
  tip.hidden = true;
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
  if (state.overRef || state.overTip) return;
  if (state.hideTimer) clearTimeout(state.hideTimer);
  state.hideTimer = setTimeout(() => {
    state.hideTimer = null;
    if (!state.overRef && !state.overTip) hideTip(tip);
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
    untrack: track(tip),
    generated: options.generated === true,
    mount: options.mount || null,
    timer: null,
    hideTimer: null,
    overRef: false,
    overTip: false,
  };

  const onHide = () => hideTip(tip);
  const onReposition = () => {
    if (!tip.hidden && state.activeRef) repositionTip(state.activeRef, tip);
  };

  tip.addEventListener(EVENTS.reposition, onReposition, { signal: controller.signal });
  tip.addEventListener(EVENTS.hide, onHide, { signal: controller.signal });
  tip.addEventListener(EVENTS.outOfView, onHide, { signal: controller.signal });
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
  const text = trigger.getAttribute("data-tooltip");

  // shorthand: data-tooltip="text" → create element lazily
  if (text) {
    uid++;
    tip = document.createElement("div");
    tip.className = "tooltip";
    tip.role = "tooltip";
    tip.id = `tooltip-${uid}`;
    tip.textContent = text;
    tip.hidden = true;
    tip.style.position = "fixed";
    generated = true;

    const parent = trigger.closest("dialog") || document.body;
    parent.appendChild(tip);
    const existing = trigger.getAttribute("aria-describedby");
    if (!existing) trigger.setAttribute("aria-describedby", tip.id);
  }

  // explicit: data-tooltip (empty) + aria-describedby → find existing element
  if (!tip) {
    const tipId = trigger.getAttribute("aria-describedby");
    if (!tipId) {
      return null;
    }
    tip = document.getElementById(tipId);
    if (!tip || tip.getAttribute("role") !== "tooltip") {
      return null;
    }
    tip.hidden = true;
    tip.style.position = "fixed";

    if (!tipStates.has(tip)) {
      mount = mountTip(tip, trigger);
    }
  }

  const state = wireTip(tip, { generated, mount });
  state.refs.add(trigger);

  const triggerController = new AbortController();
  const onLeave = () => {
    state.overRef = false;
    scheduleHide(tip);
  };
  trigger.addEventListener("mouseleave", onLeave, { signal: triggerController.signal });
  trigger.addEventListener("blur", onLeave, { signal: triggerController.signal });

  const cleanup = () => {
    triggerController.abort();
    triggerStates.delete(trigger);

    state.refs.delete(trigger);
    if (state.activeRef === trigger) {
      hideTip(tip);
      state.activeRef = null;
    }
    // Other triggers still share this tooltip: keep the tip wiring alive.
    if (state.refs.size > 0) return;

    hideTip(tip);
    state.controller.abort();
    state.untrack();
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

function show(tip, ref) {
  const state = tipStates.get(tip);
  if (!state) return;

  state.activeRef = ref;
  state.overRef = true;
  clearHide(tip);
  if (state.timer) clearTimeout(state.timer);
  state.timer = setTimeout(() => {
    state.timer = null;
    tip.hidden = false;
    repositionTip(ref, tip);
  }, SHOW_DELAY_MS);
}

// ── Delegated discovery (mouseover + focusin bubble) ───

const SEL = "[data-tooltip]";

function handleTriggerIntent(e) {
  const trigger = e.target.closest?.(SEL);
  if (!trigger) return;
  if (e.type === "mouseover" && e.relatedTarget instanceof Node && trigger.contains(e.relatedTarget)) return;

  const tip = ensureTip(trigger);
  if (tip) show(tip, trigger);
}

// Delegated discovery listeners run at import time; keep SSR imports inert.
if (typeof document !== "undefined") {
  document.addEventListener("mouseover", handleTriggerIntent);
  document.addEventListener("focusin", handleTriggerIntent);

  // No-op at connect: discovery is lazy via mouseover/focusin.
  // Cleanup is handled by the sweep when the trigger leaves the DOM.
  enhance({
    [SEL]: (trigger) => () => cleanupTrigger(trigger),
  });
}
