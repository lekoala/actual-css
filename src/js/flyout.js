/*
 * Flyout trigger — trigger adapter over the shared action-surface runtime.
 *
 * App menus keep roving focus and menuitem activation. Nav panels reuse the
 * same surface lifecycle without menu semantics.
 */

import enhance from "./enhance.js";
import { focusFirstDescendant } from "./focus.js";
import { focusFirstMenuItem, focusLastMenuItem, getMenuItems } from "./menu.js";
import {
  closeSurface,
  disconnectSurface,
  isSurfaceOpen,
  openSurface,
  prepareSurface,
} from "./surface.js";

// trigger -> { flyout, controller }
const triggerMap = new WeakMap();

function openFlyout(flyout, trigger) {
  openSurface(flyout, { trigger, source: trigger });
}

function openAndFocusPanel(flyout, trigger) {
  if (!isSurfaceOpen(flyout)) openFlyout(flyout, trigger);
  focusFirstDescendant(flyout);
}

function onTriggerClick(e) {
  const trigger = e.currentTarget;
  const state = triggerMap.get(trigger);
  if (!state) return;
  e.stopPropagation();
  const flyout = state.flyout;
  if (!flyout || !flyout.isConnected) return;
  if (isSurfaceOpen(flyout)) closeSurface(flyout);
  else openFlyout(flyout, trigger);
}

function onTriggerKeydown(e) {
  const trigger = e.currentTarget;
  const state = triggerMap.get(trigger);
  if (!state) return;
  const flyout = state.flyout;
  if (!flyout || !flyout.isConnected) return;
  const items = getMenuItems(flyout);
  const isActionList = items.length > 0;

  if (!isActionList) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        openAndFocusPanel(flyout, trigger);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (isSurfaceOpen(flyout)) closeSurface(flyout);
        else openAndFocusPanel(flyout, trigger);
        break;
      case "Tab":
        if (isSurfaceOpen(flyout) && !e.shiftKey && focusFirstDescendant(flyout)) {
          e.preventDefault();
        }
        break;
    }
    return;
  }

  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      if (!isSurfaceOpen(flyout)) openFlyout(flyout, trigger);
      focusFirstMenuItem(flyout);
      break;
    case "ArrowUp":
      e.preventDefault();
      if (!isSurfaceOpen(flyout)) openFlyout(flyout, trigger);
      focusLastMenuItem(flyout);
      break;
    case "Home":
      e.preventDefault();
      if (!isSurfaceOpen(flyout)) openFlyout(flyout, trigger);
      focusFirstMenuItem(flyout);
      break;
    case "End":
      e.preventDefault();
      if (!isSurfaceOpen(flyout)) openFlyout(flyout, trigger);
      focusLastMenuItem(flyout);
      break;
    case "Enter":
    case " ":
      e.preventDefault();
      if (!isSurfaceOpen(flyout)) {
        openFlyout(flyout, trigger);
        focusFirstMenuItem(flyout);
      } else {
        closeSurface(flyout);
      }
      break;
    case "Tab":
      if (isSurfaceOpen(flyout)) closeSurface(flyout);
      break;
  }
}

function connectTrigger(trigger) {
  if (triggerMap.has(trigger)) return;
  const flyoutId = trigger.getAttribute("aria-controls");
  const flyout = flyoutId && document.getElementById(flyoutId);
  if (!flyout || !flyout.matches(".flyout")) return;

  const controller = new AbortController();
  triggerMap.set(trigger, { flyout, controller });

  prepareSurface(flyout, trigger);

  trigger.addEventListener("click", onTriggerClick, { signal: controller.signal });
  trigger.addEventListener("keydown", onTriggerKeydown, { signal: controller.signal });
}

function disconnectTrigger(trigger) {
  const state = triggerMap.get(trigger);
  if (!state) return;
  state.controller.abort();
  disconnectFlyout(state.flyout);
  triggerMap.delete(trigger);
}

function connectFlyout(flyout) {
  if (!flyout.id) return;
  const triggers = document.querySelectorAll(`[aria-controls="${CSS.escape(flyout.id)}"]`);
  for (const trigger of triggers) {
    if (!triggerMap.has(trigger)) connectTrigger(trigger);
  }
}

function disconnectFlyout(flyout) {
  if (!flyout) return;
  disconnectSurface(flyout);
}

enhance({
  "[aria-controls]": (trigger) => {
    connectTrigger(trigger);
    return () => disconnectTrigger(trigger);
  },
  ".flyout": (flyout) => {
    connectFlyout(flyout);
    return () => disconnectFlyout(flyout);
  },
});
