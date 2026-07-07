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

let uid = 0;
const tipMap = new WeakMap(); // trigger -> tip | null
const cleanupMap = new WeakMap(); // trigger -> cleanup
const generatedTips = new WeakSet();
const mountedTips = new WeakMap(); // tip -> original { parent, next }
const delayMap = new WeakMap(); // tip -> pending show timer
const tipStates = new WeakMap(); // tip -> { refs, activeRef, controller, untrack }

function mountTip(tip, trigger) {
  const root = trigger.closest("dialog") || document.body;
  const parent = tip.parentNode;
  if (!root || !parent || parent === root) return;

  mountedTips.set(tip, { parent, next: tip.nextSibling });
  root.append(tip);
}

function restoreTip(tip) {
  const mount = mountedTips.get(tip);
  if (!mount) return;

  if (mount.parent.isConnected) {
    const next = mount.next?.parentNode === mount.parent ? mount.next : null;
    mount.parent.insertBefore(tip, next);
  } else {
    tip.remove();
  }

  mountedTips.delete(tip);
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
  const timer = delayMap.get(tip);
  if (timer) {
    clearTimeout(timer);
    delayMap.delete(tip);
  }
  tip.hidden = true;
}

// Tip-level wiring happens once per tooltip element, even when an explicit
// tooltip is shared by several triggers. activeRef is the trigger that last
// showed the tip, so reposition follows the right reference.
function wireTip(tip) {
  let state = tipStates.get(tip);
  if (state) return state;

  const controller = new AbortController();
  state = { refs: new Set(), activeRef: null, controller, untrack: track(tip) };

  const onHide = () => hideTip(tip);
  const onReposition = () => {
    if (!tip.hidden && state.activeRef) repositionTip(state.activeRef, tip);
  };

  tip.addEventListener(EVENTS.reposition, onReposition, { signal: controller.signal });
  tip.addEventListener(EVENTS.hide, onHide, { signal: controller.signal });
  tip.addEventListener(EVENTS.outOfView, onHide, { signal: controller.signal });

  tipStates.set(tip, state);
  return state;
}

function ensureTip(trigger) {
  if (tipMap.has(trigger)) return tipMap.get(trigger);

  let tip;
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
    tip.inert = true;
    generatedTips.add(tip);

    const parent = trigger.closest("dialog") || document.body;
    parent.appendChild(tip);
    const existing = trigger.getAttribute("aria-describedby");
    const ids = existing ? `${existing} ${tip.id}` : tip.id;
    trigger.setAttribute("aria-describedby", ids);
  }

  // explicit: data-tooltip (empty) + aria-describedby → find existing element
  if (!tip) {
    const tipId = trigger.getAttribute("aria-describedby");
    if (!tipId) {
      tipMap.set(trigger, null);
      return null;
    }
    tip = document.getElementById(tipId);
    if (!tip || tip.getAttribute("role") !== "tooltip") {
      tipMap.set(trigger, null);
      return null;
    }
    tip.hidden = true;
    tip.style.position = "fixed";

    mountTip(tip, trigger);
  }

  const state = wireTip(tip);
  state.refs.add(trigger);

  const onLeave = () => hideTip(tip);
  trigger.addEventListener("mouseleave", onLeave);
  trigger.addEventListener("blur", onLeave);

  cleanupMap.set(trigger, () => {
    trigger.removeEventListener("mouseleave", onLeave);
    trigger.removeEventListener("blur", onLeave);
    tipMap.delete(trigger);
    cleanupMap.delete(trigger);

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
    if (generatedTips.has(tip)) tip.remove();
    else restoreTip(tip);
  });

  tipMap.set(trigger, tip);
  return tip;
}

function cleanupTrigger(trigger) {
  if (trigger.isConnected) return;
  const cleanup = cleanupMap.get(trigger);
  if (cleanup) cleanup();
}

function show(tip, ref) {
  const state = tipStates.get(tip);
  if (state) state.activeRef = ref;

  const existing = delayMap.get(tip);
  if (existing) clearTimeout(existing);
  delayMap.set(
    tip,
    setTimeout(() => {
      delayMap.delete(tip);
      tip.hidden = false;
      repositionTip(ref, tip);
    }, SHOW_DELAY_MS),
  );
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
