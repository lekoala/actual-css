/*
 * Tooltip — supplemental label shown on hover and focus.
 *
 * Shorthand:  <button data-tooltip="Help text" data-tooltip-placement="right">
 * Explicit:   <button data-tooltip aria-describedby="tooltip-id">
 *             <div role="tooltip" id="tooltip-id" hidden>Help <strong>text</strong></div>
 * Options:    data-tooltip-click toggles on click instead of hover/focus.
 *             data-tooltip-no-tap keeps a touch tap from opening it.
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
 *             first hover / focusin. No page-load scan, no DOM overhead
 *             for tooltips that are never triggered. AJAX-loaded triggers
 *             work automatically via bubbling delegated listeners.
 *
 * Snapshot, not reactive: generated tooltip text is synchronized when
 *             the tooltip is shown. Changes to data-tooltip do not rewrite
 *             a tooltip that is already shown. Always-visible generated
 *             tooltips therefore keep their initial text; use an explicit
 *             tooltip when its content must update dynamically.
 *
 * Show:       hover + keyboard focus (150ms delay), click toggle, or always
 *             visible. Focus counts only when it matches :focus-visible, so
 *             a pointer press, or focus handed back by a closing dialog after
 *             a pointer close, shows nothing.
 * Touch:      a tap shows the tip at once and pins it, so no tooltip is
 *             silently out of reach of a finger; the tap still activates the
 *             trigger. A second tap, a tap elsewhere, Escape, or a dialog or
 *             popover opening hides it. A scroll or drag ends in
 *             pointercancel, not pointerup, so it is never a tap.
 * Hide:       focus leaving the trigger (focusout), pointer leave, pressing
 *             the trigger, or Escape.
 *
 * Geometry:   a trigger scrolled out of the positioning boundary takes its tip
 *             down and keeps it tracked, so scrolling back brings the same tip
 *             up again with no second hover or tap.
 *
 * Coordinates: viewport by default, document coordinates whenever the trigger
 *             scrolls with the page. See positionModeFor().
 *
 * Transport:  the top layer, via popover="manual", written by the runtime on
 *             every tip it manages. A .tooltip[popover] with no data-tooltip
 *             trigger pointing at it is never reached from here and stays the
 *             application's own to drive.
 */

import { autoUpdate, reposition } from "@lekoala/floating";
import enhance from "./enhance.js";
import { registerEscapeDismissal } from "./escape.js";
import { positionModeFor, readPlacement } from "./floating-space.js";
import { hidePopover, showPopover } from "./popover-transport.js";
import { CLASSES } from "./selectors.js";

const SHOW_DELAY_MS = 150;
const HIDE_DELAY_MS = 100;

/**
 * @typedef {object} TooltipState
 * @property {Set<Element>} refs Triggers that currently reference this tip.
 * @property {Element | null} activeRef Trigger that last showed this tip.
 * @property {AbortController} controller Tip-level event listener cleanup.
 * @property {(() => void) | null} stopTracking Floating-position cleanup while wanted.
 * @property {Element | null} trackedRef Reference the current subscription observes.
 * @property {(() => void) | null} unregisterEscape Escape-stack cleanup while visible and dismissable.
 * @property {Element | null} escapeRef Trigger represented by the current Escape-stack entry.
 * @property {boolean} generated True when the tip was created from data-tooltip text.
 * @property {boolean} wanted True while the interaction asks for this tip, positionable or not.
 * @property {boolean} visible True while the tip is promoted to the top layer.
 * @property {"viewport" | "document"} space Coordinate space the tip is written in.
 * @property {ReturnType<typeof setTimeout> | null} timer Pending delayed show.
 * @property {ReturnType<typeof setTimeout> | null} hideTimer Pending delayed hide.
 * @property {boolean} hovered Pointer is over the active trigger.
 * @property {boolean} focused The active trigger has keyboard focus.
 * @property {boolean} overTip Pointer is over the tooltip.
 * @property {boolean} tapped A touch tap pinned the tip open.
 */

let uid = 0;
const triggerStates = new WeakMap(); // trigger -> { tip, cleanup }
/** @type {WeakMap<Element, TooltipState>} */
const tipStates = new WeakMap(); // tip -> { refs, activeRef, controller, stopTracking, generated, visible, timer }
/** @type {Element | null} The tip a tap pinned open; a tap elsewhere dismisses it. */
let tappedTip = null;

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

/*
 * Coordinate space, resolved once per shown tip.
 *
 * The engine always measures in viewport coordinates; the space only decides
 * what gets written. Document coordinates let the browser scroll the tip along
 * with the page, so it stays attached during touch scrolling instead of
 * trailing its trigger until the next autoUpdate() frame. That holds only
 * while the trigger scrolls with the page too: against a viewport-anchored
 * trigger the browser would carry the tip away on every scroll and each update
 * would snap it back, which is worse than the lag it removes.
 *
 * Which is why this asks about the trigger, not about the tip. An open popover
 * is in the top layer, where an absolutely positioned box resolves against the
 * initial containing block whatever its ancestors do — measured for
 * position: relative, transform, filter, contain and both dialog modes — so
 * the tip's own placement never enters into it.
 */
function placementFor(ref) {
  return readPlacement(ref, "data-tooltip-placement") ?? "top";
}

function hasOption(trigger, name) {
  const value = trigger?.getAttribute(name);
  return typeof value === "string" && value.toLowerCase() !== "false";
}

function isClickTrigger(trigger) {
  return hasOption(trigger, "data-tooltip-click");
}

// Taps open tooltips by default: the opt-out is explicit, so a tooltip never
// fails silently under a finger.
function isNoTapTrigger(trigger) {
  return hasOption(trigger, "data-tooltip-no-tap");
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

function repositionTip(ref, tip, space) {
  return reposition(ref, tip, {
    placement: placementFor(ref),
    distance: 6,
    flip: true,
    shift: true,
    coordinateSpace: space,
  });
}

/*
 * One update, from show() or from a tracking tick.
 *
 * Two separate notions, deliberately: `wanted` is what the interaction asks
 * for — hover, focus, a click toggle, data-tooltip-visible — and `visible` is
 * what is actually promoted. They come apart whenever the trigger leaves the
 * positioning boundary, because reposition() returning false means "not
 * positionable right now", not "the interaction is over": the tip goes down
 * and its tracking stays, so scrolling the trigger back into view brings the
 * same tip up again with no second hover or tap. Only hideTip() ends a tip.
 *
 * A closed popover has no box to measure, so the tip has to be promoted
 * before it can be positioned, and demoted again when that fails.
 */
function updateTrackedTip(tip, state) {
  const ref = state.activeRef;
  if (!ref || !state.wanted) return;

  if (!state.visible) {
    if (!showPopover(tip)) return;
    state.visible = true;
  }

  if (!repositionTip(ref, tip, state.space)) {
    state.visible = false;
    hidePopover(tip);
  }
  syncEscapeDismissal(tip, state);
}

// A subscription observes one reference, so a shared tip re-shown from another
// trigger has to resubscribe — tracking now outlives a demoted tip, and would
// otherwise keep watching the trigger that is no longer active.
function startTracking(tip, state) {
  if (state.stopTracking) {
    if (state.trackedRef === state.activeRef) return;
    stopTracking(state);
  }

  state.trackedRef = state.activeRef;
  state.stopTracking = autoUpdate(state.activeRef, tip, () => updateTrackedTip(tip, state));
}

function stopTracking(state) {
  state?.stopTracking?.();
  if (state) {
    state.stopTracking = null;
    state.trackedRef = null;
  }
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
  if (state) {
    state.wanted = false;
    state.visible = false;
    state.tapped = false;
  }
  if (tappedTip === tip) tappedTip = null;
  hidePopover(tip);
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
  if (state.hovered || state.focused || state.overTip || state.tapped) return;
  if (state.hideTimer) clearTimeout(state.hideTimer);
  state.hideTimer = setTimeout(() => {
    state.hideTimer = null;
    if (!state.hovered && !state.focused && !state.overTip && !state.tapped) hideTip(tip);
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
    trackedRef: null,
    unregisterEscape: null,
    escapeRef: null,
    generated: options.generated === true,
    wanted: false,
    visible: false,
    space: "viewport",
    timer: null,
    hideTimer: null,
    hovered: false,
    focused: false,
    overTip: false,
    tapped: false,
  };

  tip.addEventListener(
    "pointerenter",
    () => {
      state.overTip = true;
      clearHide(tip);
    },
    { signal: controller.signal },
  );
  tip.addEventListener(
    "pointerleave",
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

  // shorthand: data-tooltip="text" → create element lazily.
  // Shorthand content is always text. Never use innerHTML here:
  // data-tooltip may hold application/user-provided strings. Rich content
  // belongs in an explicit author-owned tooltip.
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
    "pointerleave",
    () => {
      state.hovered = false;
      scheduleHide(tip);
    },
    { signal: triggerController.signal },
  );
  trigger.addEventListener(
    // blur does not bubble: on a composite trigger (focusable children) the
    // loss of focus is only observable through focusout. relatedTarget keeps
    // a focus move between the trigger's own children from ending the tip.
    "focusout",
    (event) => {
      if (event.relatedTarget && trigger.contains(event.relatedTarget)) return;
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

  // Shorthand tips copy data-tooltip text at creation; re-read it on every
  // show so a "Copy" → "Copied!" update is reflected without rewiring.
  // Text only, never innerHTML — see the note at creation above.
  if (state.generated) {
    const text = ref.getAttribute("data-tooltip");
    if (text && tip.textContent !== text) tip.textContent = text;
  }

  state.activeRef = ref;
  const mode = positionModeFor(ref);
  state.space = mode.space;
  tip.style.position = mode.position;
  syncEscapeDismissal(tip, state);
  clearHide(tip);
  if (state.timer) clearTimeout(state.timer);
  const reveal = () => {
    state.timer = null;
    state.wanted = true;
    startTracking(tip, state);
    updateTrackedTip(tip, state);
  };

  if (immediate) reveal();
  else state.timer = setTimeout(reveal, SHOW_DELAY_MS);
}

// ── Delegated trigger interactions ───

const SEL = "[data-tooltip]";
/** @type {WeakRef<Element> | null} */
let pressedTrigger = null;
// The current press hid its trigger's tip: its release must not reopen it.
let pressDismissed = false;

function handleTriggerIntent(e) {
  const trigger = e.target.closest?.(SEL);
  if (!trigger) return;
  if (isClickTrigger(trigger) || isAlwaysVisible(trigger)) return;
  // Touch generates pointerover on contact. A held pointer can cross more
  // triggers during a drag. Neither is a hover intent.
  if (e.type === "pointerover" && (e.pointerType === "touch" || e.buttons)) return;
  // A pointer or focus move between the trigger's own children is not a new
  // intent: it must not restart the show delay or rewrite the intent flags.
  if (e.relatedTarget instanceof Node && trigger.contains(e.relatedTarget)) return;

  // Text fields can match :focus-visible even when the press focused them.
  if (
    e.type === "focusin" &&
    (!e.target.matches(":focus-visible") || pressedTrigger?.deref() === trigger)
  )
    return;

  const tip = ensureTip(trigger);
  if (!tip) return;

  const state = tipStates.get(tip);
  if (e.type === "focusin") state.focused = true;
  else state.hovered = true;
  show(tip, trigger);
}

function handleTriggerPress(e) {
  const trigger = e.target.closest?.(SEL);
  pressedTrigger = trigger ? new WeakRef(trigger) : null;
  pressDismissed = false;
  if (!trigger || isClickTrigger(trigger) || isAlwaysVisible(trigger)) return;

  const tip = triggerStates.get(trigger)?.tip;
  const state = tip && tipStates.get(tip);
  if (!state || state.activeRef !== trigger) return;

  // Also cancel a delayed show or a tip waiting to come back into view.
  if (!state.timer && !state.wanted && !state.visible) return;
  state.hovered = false;
  state.focused = false;
  state.overTip = false;
  hideTip(tip, true);
  pressDismissed = true;
}

/*
 * Touch has no hover, and a tap focuses without :focus-visible, so a finger
 * reaches a tooltip only through this. Touch pointers are
 * implicitly captured, so the release targets the element the press landed on.
 * The outside dismissal runs for any pointer, so a hybrid device can close a
 * pinned tip with the mouse too; it never stops the event.
 */
function handleTap(e) {
  const target = /** @type {Element} */ (e.target);
  if (tappedTip && !tappedTip.contains(target)) {
    const ref = tipStates.get(tappedTip)?.activeRef;
    if (!ref?.contains(target)) hideTip(tappedTip, true);
  }

  if (e.pointerType !== "touch") return;
  const trigger = target.closest?.(SEL);
  if (!trigger || pressDismissed || pressedTrigger?.deref() !== trigger) return;
  if (isNoTapTrigger(trigger) || isClickTrigger(trigger) || isAlwaysVisible(trigger)) return;

  const tip = ensureTip(trigger);
  if (!tip) return;
  const state = tipStates.get(tip);
  state.tapped = true;
  tappedTip = tip;
  show(tip, trigger, true);
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
  document.addEventListener("pointerover", handleTriggerIntent);
  document.addEventListener("focusin", handleTriggerIntent);
  // A drag handler can stop the press before it bubbles to the document.
  document.addEventListener("pointerdown", handleTriggerPress, { capture: true });
  document.addEventListener("pointerup", handleTap, { capture: true });
  // A tap that opens a dialog or a popover moved on from its trigger: the
  // pinned label would linger under the new layer. toggle does not bubble.
  document.addEventListener(
    "toggle",
    (e) => {
      const opened = /** @type {ToggleEvent} */ (e).newState === "open";
      if (opened && tappedTip && !e.target.matches?.('[role="tooltip"]')) {
        hideTip(tappedTip, true);
      }
    },
    { capture: true },
  );
  document.addEventListener(
    "keydown",
    () => {
      pressedTrigger = null;
    },
    { capture: true },
  );
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
