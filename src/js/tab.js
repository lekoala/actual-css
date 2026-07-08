/*
 * Tabs — in-place panel switcher using real tab semantics.
 *
 * Tab list:  [role="tablist"]
 * Tab:       [role="tab"]  with aria-selected, aria-controls, id, tabindex
 * Panel:     [role="tabpanel"]  with id matching aria-controls
 *
 * Keyboard:  ArrowLeft/Right, Home/End (select tab, wrapping)
 *            ArrowUp/Down for aria-orientation="vertical"
 *            ArrowDown (focus selected panel)
 *
 * Self-registers via enhance: injected tablists wire automatically.
 * The tab→panel map is rebuilt from the live tablist on each interaction,
 * so tabs added after connect are picked up with no extra work.
 * Cleanup is the AbortController.abort() returned to enhance.
 */

import enhance from "./enhance.js";
import { firstItem, lastItem, nextItem } from "./keys.js";

function tabsOf(list) {
  return [...list.querySelectorAll('[role="tab"]')];
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
  return panelId ? document.getElementById(panelId) : null;
}

function makePanelFocusable(panel) {
  if (!panel.hasAttribute("tabindex")) {
    panel.tabIndex = -1;
  }
}

function activate(tab) {
  if (!tab) return;
  const list = tab.closest('[role="tablist"]');
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
  const tabs = tabsOf(list);
  if (!tabs.length) return;
  const selected =
    tabs.find((tab) => tab.getAttribute("aria-selected") === "true" && panelFor(tab)) ||
    tabs.find((tab) => panelFor(tab)) ||
    tabs[0];
  activate(selected);
}

function onKeydown(e) {
  const tab = e.target.closest('[role="tab"]');
  if (!tab) return;
  const list = tab.closest('[role="tablist"]');
  if (!list) return;

  const tabs = tabsOf(list);
  const isVertical = list.getAttribute("aria-orientation") === "vertical";
  let next;

  switch (e.key) {
    case "ArrowRight":
      if (isVertical) break;
      e.preventDefault();
      next = nextItem(tabs, tab, 1, { wrap: true });
      if (next) activateAndFocus(next);
      break;
    case "ArrowLeft":
      if (isVertical) break;
      e.preventDefault();
      next = nextItem(tabs, tab, -1, { wrap: true });
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
      next = nextItem(tabs, tab, 1, { wrap: true });
      if (next) activateAndFocus(next);
      break;
    case "ArrowUp":
      if (!isVertical) break;
      e.preventDefault();
      next = nextItem(tabs, tab, -1, { wrap: true });
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
  const tab = e.target.closest('[role="tab"]');
  if (!tab) return;
  e.preventDefault();
  if (tab.getAttribute("aria-selected") === "true") return;
  activate(tab);
  tab.focus();
}

enhance({
  '[role="tablist"]': (list) => {
    const controller = new AbortController();
    initialize(list);
    list.addEventListener("click", onClick, { signal: controller.signal });
    list.addEventListener("keydown", onKeydown, { signal: controller.signal });
    return () => controller.abort();
  },
});
