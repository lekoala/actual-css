/*
 * Tabs — in-place panel switcher using real tab semantics.
 *
 * Tab list:  [data-enhance="tabs"] with role="tablist"
 * Tab:       [role="tab"]  with aria-selected, aria-controls, id, tabindex
 * Panel:     [role="tabpanel"]  with id matching aria-controls
 *
 * Keyboard:  ArrowLeft/Right, Home/End (select tab, wrapping)
 *            ArrowUp/Down for aria-orientation="vertical"
 *            ArrowDown (focus selected panel)
 *
 * Self-registers via registerEnhancement: injected tablists wire automatically.
 * The tab→panel map is rebuilt from the live tablist on each interaction,
 * so tabs added after connect are picked up with no extra work.
 * Cleanup is the AbortController.abort() returned to enhance.
 */

import { registerEnhancement } from "./enhance.js";
import { firstItem, lastItem, nextItem } from "./keys.js";

const TABLIST_SELECTOR = '[data-enhance~="tabs"]';

// A tablist owns only the tabs directly beneath it, not those of a nested
// tablist. Filtering by closest owner keeps the outer list from operating on
// (and re-reacting to events from) tabs that belong to an inner list.
function tabsOf(list) {
  return [...list.querySelectorAll('[role="tab"]')].filter(
    (tab) => tab.closest(TABLIST_SELECTOR) === list,
  );
}

function panelsOf(tabs) {
  const panels = new Map();
  for (const tab of tabs) {
    const panel = panelFor(tab);
    if (panel) panels.set(tab, panel);
  }
  return panels;
}

function panelFor(tab) {
  const panelId = tab.getAttribute("aria-controls");
  return panelId ? tab.ownerDocument.getElementById(panelId) : null;
}

function isTabDisabled(tab) {
  return tab.disabled || tab.getAttribute("aria-disabled") === "true";
}

function activatableTabs(list) {
  return tabsOf(list).filter((tab) => !isTabDisabled(tab) && panelFor(tab));
}

function makePanelFocusable(panel) {
  if (!panel.hasAttribute("tabindex")) {
    panel.tabIndex = -1;
  }
}

function activate(tab) {
  if (!tab || isTabDisabled(tab) || !panelFor(tab)) return;
  const list = tab.closest(TABLIST_SELECTOR);
  if (!list) return;
  const tabs = tabsOf(list);
  const panels = panelsOf(tabs);

  for (const t of tabs) {
    t.setAttribute("aria-selected", "false");
    t.tabIndex = -1;
  }
  for (const [, panel] of panels) {
    panel.hidden = true;
  }
  tab.setAttribute("aria-selected", "true");
  tab.tabIndex = 0;
  const panel = panels.get(tab);
  if (panel) {
    makePanelFocusable(panel);
    panel.hidden = false;
  }
}

function activateAndFocus(tab) {
  if (!tab) return;
  activate(tab);
  tab.focus();
}

function initialize(list) {
  const tabs = activatableTabs(list);
  if (!tabs.length) return;
  const selected = tabs.find((tab) => tab.getAttribute("aria-selected") === "true") || tabs[0];
  activate(selected);
}

function onKeydown(e) {
  const list = e.currentTarget;
  const tab = e.target.closest('[role="tab"]');
  if (!tab || tab.closest(TABLIST_SELECTOR) !== list) return;

  const tabs = activatableTabs(list);
  if (!tabs.length || !tabs.includes(tab)) return;
  const isVertical = list.getAttribute("aria-orientation") === "vertical";
  let next;

  switch (e.key) {
    case "ArrowRight":
      if (isVertical) break;
      e.preventDefault();
      next = nextItem(tabs, tab, 1);
      if (next) activateAndFocus(next);
      break;
    case "ArrowLeft":
      if (isVertical) break;
      e.preventDefault();
      next = nextItem(tabs, tab, -1);
      if (next) activateAndFocus(next);
      break;
    case "ArrowDown":
      if (!isVertical) {
        e.preventDefault();
        const panel = panelFor(tab);
        if (panel) {
          makePanelFocusable(panel);
          panel.focus();
        }
        break;
      }
      e.preventDefault();
      next = nextItem(tabs, tab, 1);
      if (next) activateAndFocus(next);
      break;
    case "ArrowUp":
      if (!isVertical) break;
      e.preventDefault();
      next = nextItem(tabs, tab, -1);
      if (next) activateAndFocus(next);
      break;
    case "Home":
      e.preventDefault();
      activateAndFocus(firstItem(tabs));
      break;
    case "End":
      e.preventDefault();
      activateAndFocus(lastItem(tabs));
      break;
    case "Enter":
    case " ":
      e.preventDefault();
      activate(tab);
      break;
  }
}

function onClick(e) {
  const list = e.currentTarget;
  const tab = e.target.closest('[role="tab"]');
  if (!tab || tab.closest(TABLIST_SELECTOR) !== list) return;
  if (isTabDisabled(tab)) {
    e.preventDefault();
    return;
  }
  e.preventDefault();
  if (tab.getAttribute("aria-selected") === "true") return;
  activate(tab);
  tab.focus();
}

registerEnhancement("tabs", (list) => {
  const controller = new AbortController();
  initialize(list);
  list.addEventListener("click", onClick, { signal: controller.signal });
  list.addEventListener("keydown", onKeydown, { signal: controller.signal });
  return () => controller.abort();
});
