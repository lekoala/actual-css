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

let uid = 0;
const tipMap = new WeakMap();
const cleanupMap = new WeakMap();
const generatedTips = new WeakSet();
const mountedTips = new WeakMap();

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

    const placement = trigger.getAttribute("data-tooltip-placement");
    if (placement) tip._placement = placement;

    const parent = trigger.closest("dialog") || document.body;
    parent.appendChild(tip);
    trigger.setAttribute("aria-describedby", tip.id);
  }

  // explicit: data-tooltip (empty) + aria-describedby → find existing element
  if (!tip) {
    const tipId = trigger.getAttribute("aria-describedby");
    if (!tipId) { tipMap.set(trigger, null); return null; }
    tip = document.getElementById(tipId);
    if (!tip || tip.getAttribute("role") !== "tooltip") { tipMap.set(trigger, null); return null; }
    tip.hidden = true;
    tip.style.position = "fixed";

    const placement = trigger.getAttribute("data-tooltip-placement");
    if (placement) tip._placement = placement;

    mountTip(tip, trigger);
  }

  // wire event handlers
  const onHide = () => {
    if (tip._delay) clearTimeout(tip._delay);
    tip._delay = null;
    tip.hidden = true;
  };

  trigger.addEventListener("mouseleave", onHide);
  trigger.addEventListener("blur", onHide);

  const onReposition = () => {
    if (!tip.hidden) {
      reposition(trigger, tip, {
        placement: tip._placement || "top",
        distance: 6,
        flip: true,
        shift: true,
      });
    }
  };

  tip.addEventListener(EVENTS.reposition, onReposition);
  tip.addEventListener(EVENTS.hide, onHide);
  tip.addEventListener(EVENTS.outOfView, onHide);
  const untrack = track(tip);

  cleanupMap.set(trigger, () => {
    onHide();
    trigger.removeEventListener("mouseleave", onHide);
    trigger.removeEventListener("blur", onHide);
    tip.removeEventListener(EVENTS.reposition, onReposition);
    tip.removeEventListener(EVENTS.hide, onHide);
    tip.removeEventListener(EVENTS.outOfView, onHide);
    untrack();
    if (generatedTips.has(tip)) tip.remove();
    else restoreTip(tip);
    tipMap.delete(trigger);
    cleanupMap.delete(trigger);
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
  if (tip._delay) clearTimeout(tip._delay);
  tip._delay = setTimeout(() => {
    tip.hidden = false;
    reposition(ref, tip, {
      placement: tip._placement || "top",
      distance: 6,
      flip: true,
      shift: true,
    });
  }, 150);
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
