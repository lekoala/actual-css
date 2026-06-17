/*
 * Tooltip — supplemental label shown on hover and focus.
 *
 * Shorthand:  <button data-tooltip="Help text" data-tooltip-placement="right">
 * Explicit:   <button aria-describedby="tooltip-id"> + <div role="tooltip" id="tooltip-id" hidden>
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

let uid = 0;
const tipMap = new WeakMap();

function ensureTip(trigger) {
  const existing = tipMap.get(trigger);
  if (existing) return existing;

  let tip;

  // shorthand: data-tooltip → create element lazily
  const text = trigger.getAttribute("data-tooltip");
  if (text !== null) {
    uid++;
    tip = document.createElement("div");
    tip.className = "tooltip";
    tip.role = "tooltip";
    tip.id = `tooltip-${uid}`;
    tip.textContent = text;
    tip.hidden = true;
    tip.style.display = "none";
    tip.style.position = "fixed";
    tip.inert = true;

    const placement = trigger.getAttribute("data-tooltip-placement");
    if (placement) tip._placement = placement;

    const parent = trigger.closest("dialog") || document.body;
    parent.appendChild(tip);
    trigger.setAttribute("aria-describedby", tip.id);
  }

  // explicit: aria-describedby → find existing element
  if (!tip) {
    const tipId = trigger.getAttribute("aria-describedby");
    if (!tipId) return null;
    tip = document.getElementById(tipId);
    if (!tip || tip.getAttribute("role") !== "tooltip") return null;
    tip.hidden = true;
    tip.style.display = "none";
    tip.style.position = "fixed";

    const placement = trigger.getAttribute("data-tooltip-placement");
    if (placement) tip._placement = placement;
  }

  // wire event handlers
  const onHide = () => {
    if (tip._delay) clearTimeout(tip._delay);
    tip._delay = null;
    tip.hidden = true;
    tip.style.display = "none";
  };

  trigger.addEventListener("mouseleave", onHide);
  trigger.addEventListener("blur", onHide);

  tip.addEventListener("floating:reposition", () => {
    if (!tip.hidden) {
      reposition(trigger, tip, {
        placement: tip._placement || "top",
        distance: 6,
        flip: true,
        shift: true,
      });
    }
  });

  tip.addEventListener("floating:hide", onHide);
  track(tip);

  tipMap.set(trigger, tip);
  return tip;
}

function show(tip, ref) {
  if (tip._delay) clearTimeout(tip._delay);
  tip._delay = setTimeout(() => {
    tip.hidden = false;
    tip.style.display = "";
    reposition(ref, tip, {
      placement: tip._placement || "top",
      distance: 6,
      flip: true,
      shift: true,
    });
  }, 150);
}

// ── Delegated discovery (mouseover + focusin bubble) ───

const SEL = "[data-tooltip], [aria-describedby]";

if (typeof document !== "undefined") {
  document.addEventListener("mouseover", (e) => {
    const trigger = e.target.closest(SEL);
    if (!trigger) return;
    const tip = ensureTip(trigger);
    if (tip) show(tip, trigger);
  });

  document.addEventListener("focusin", (e) => {
    const trigger = e.target.closest(SEL);
    if (!trigger) return;
    const tip = ensureTip(trigger);
    if (tip) show(tip, trigger);
  });
}

export function initTooltips() {
  // lazy — nothing to scan
}
