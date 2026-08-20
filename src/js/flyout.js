import { registerEnhancement } from "./enhance.js";
import { focusFirstDescendant } from "./focus.js";
import { connectMenu, focusFirstMenuItem, focusLastMenuItem } from "./menu.js";
import { closeSurface, isSurfaceOpen, openSurface, retainSurface } from "./surface.js";

const panelRefs = new WeakMap();
const triggerMap = new WeakMap();

function normalizeBreakpoint(raw) {
  const BREAKPOINTS = { sm: 640, md: 768, lg: 1024 };
  const value = Number.parseInt(BREAKPOINTS[raw] || raw, 10);
  return Number.isFinite(value) ? value : undefined;
}

function readFlyoutOptions(panel) {
  const opts = { autoClose: "true" };
  const ds = panel.dataset;
  if (ds.flyoutPlacement) opts.placement = ds.flyoutPlacement;
  if (ds.flyoutDistance != null) {
    const d = Number.parseFloat(ds.flyoutDistance);
    if (Number.isFinite(d)) opts.distance = d;
  }
  if (ds.flyoutMobile) opts.mobile = ds.flyoutMobile;
  if (ds.flyoutBreakpoint) {
    const bp = normalizeBreakpoint(ds.flyoutBreakpoint);
    if (bp != null) opts.breakpoint = bp;
  }
  if (ds.flyoutAutoClose) opts.autoClose = ds.flyoutAutoClose;
  return opts;
}

function panelFor(trigger) {
  const id = trigger.getAttribute("aria-controls");
  return id ? trigger.ownerDocument.getElementById(id) : null;
}

function isMenuFlyout(panel) {
  return panel.matches("menu") || panel.classList.contains("menu");
}

function openFlyout(panel, trigger) {
  return openSurface(panel, {
    trigger,
    source: trigger,
    ...readFlyoutOptions(panel),
  });
}

function openAndFocusPanel(flyout, trigger) {
  if (!isSurfaceOpen(flyout) && !openFlyout(flyout, trigger)) return false;
  return focusFirstDescendant(flyout);
}

function onTriggerClick(e) {
  const trigger = e.currentTarget;
  const state = triggerMap.get(trigger);
  if (!state) return;
  e.stopPropagation();
  const panel = resolvePanel(trigger, state);
  if (!panel) return;
  if (isSurfaceOpen(panel)) closeSurface(panel);
  else openFlyout(panel, trigger);
}

function onTriggerKeydown(e) {
  const trigger = e.currentTarget;
  const state = triggerMap.get(trigger);
  if (!state) return;
  const panel = resolvePanel(trigger, state);
  if (!panel) return;
  const isActionList = isMenuFlyout(panel);

  if (!isActionList) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        openAndFocusPanel(panel, trigger);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (isSurfaceOpen(panel)) closeSurface(panel);
        else openAndFocusPanel(panel, trigger);
        break;
      case "Tab":
        if (isSurfaceOpen(panel) && !e.shiftKey && focusFirstDescendant(panel)) {
          e.preventDefault();
        }
        break;
    }
    return;
  }

  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      if (!isSurfaceOpen(panel) && !openFlyout(panel, trigger)) break;
      focusFirstMenuItem(panel);
      break;
    case "ArrowUp":
      e.preventDefault();
      if (!isSurfaceOpen(panel) && !openFlyout(panel, trigger)) break;
      focusLastMenuItem(panel);
      break;
    case "Home":
      e.preventDefault();
      if (!isSurfaceOpen(panel) && !openFlyout(panel, trigger)) break;
      focusFirstMenuItem(panel);
      break;
    case "End":
      e.preventDefault();
      if (!isSurfaceOpen(panel) && !openFlyout(panel, trigger)) break;
      focusLastMenuItem(panel);
      break;
    case "Enter":
    case " ":
      e.preventDefault();
      if (!isSurfaceOpen(panel)) {
        if (openFlyout(panel, trigger)) focusFirstMenuItem(panel);
      } else {
        closeSurface(panel);
      }
      break;
    case "Tab":
      if (isSurfaceOpen(panel)) closeSurface(panel);
      break;
  }
}

function connectTrigger(trigger) {
  if (triggerMap.has(trigger)) return;

  const controller = new AbortController();
  const state = { panel: null, controller, releaseMenu: null };
  triggerMap.set(trigger, state);

  resolvePanel(trigger, state);

  if (!trigger.hasAttribute("aria-expanded")) {
    trigger.setAttribute("aria-expanded", "false");
  }

  trigger.addEventListener("click", onTriggerClick, { signal: controller.signal });
  trigger.addEventListener("keydown", onTriggerKeydown, { signal: controller.signal });
}

function releasePanelReference(trigger, state) {
  state.releaseMenu?.();
  state.releaseMenu = null;

  const panel = state.panel;
  state.panel = null;
  if (!panel) return;

  const panelEntry = panelRefs.get(panel);
  if (!panelEntry) return;

  panelEntry.triggers.delete(trigger);
  if (panelEntry.triggers.size === 0) {
    panelEntry.release();
    panelRefs.delete(panel);
  }
}

function resolvePanel(trigger, state) {
  const panel = panelFor(trigger);
  if (state.panel === panel && panel?.isConnected) return panel;

  releasePanelReference(trigger, state);
  if (!panel) return null;

  let panelEntry = panelRefs.get(panel);
  if (!panelEntry) {
    const release = retainSurface(panel);
    panelEntry = { triggers: new Set(), release };
    panelRefs.set(panel, panelEntry);
  }
  panelEntry.triggers.add(trigger);
  state.panel = panel;

  if (isMenuFlyout(panel)) {
    state.releaseMenu = connectMenu(panel, {
      close: (menu) => closeSurface(menu),
    });
  }
  if (!trigger.hasAttribute("aria-haspopup") && isMenuFlyout(panel)) {
    trigger.setAttribute("aria-haspopup", "menu");
  }

  return panel;
}

function disconnectTrigger(trigger) {
  const state = triggerMap.get(trigger);
  if (!state) return;
  state.controller.abort();
  if (state.panel?.isConnected && isSurfaceOpen(state.panel)) {
    closeSurface(state.panel, { restoreFocus: false });
  }
  releasePanelReference(trigger, state);
  triggerMap.delete(trigger);
}

registerEnhancement("flyout", (trigger) => {
  connectTrigger(trigger);
  return () => disconnectTrigger(trigger);
});
