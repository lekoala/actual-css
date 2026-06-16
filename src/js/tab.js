/*
 * Tabs — in-place panel switcher using real tab semantics.
 *
 * Tab list:  [role="tablist"]
 * Tab:       [role="tab"]  with aria-selected, aria-controls, id, tabindex
 * Panel:     [role="tabpanel"]  with id matching aria-controls
 *
 * Keyboard:  ArrowLeft/Right, Home/End (roving tabindex)
 *            Enter/Space (manual activation)
 */

export function initTabs() {
  const lists = document.querySelectorAll('[role="tablist"]');

  for (const list of lists) {
    if (list._tabsInit) continue;
    list._tabsInit = true;
    const tabs = [...list.querySelectorAll('[role="tab"]')];

    // build tab → panel map
    const panels = new Map();
    for (const tab of tabs) {
      const panelId = tab.getAttribute("aria-controls");
      if (panelId) {
        const panel = document.getElementById(panelId);
        if (panel) panels.set(tab, panel);
      }
    }

    function activate(tab) {
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
      if (panel) panel.hidden = false;
    }

    list.addEventListener("click", (e) => {
      const tab = e.target.closest('[role="tab"]');
      if (!tab || tab.getAttribute("aria-selected") === "true") return;
      activate(tab);
      tab.focus();
    });

    list.addEventListener("keydown", (e) => {
      const tab = e.target.closest('[role="tab"]');
      if (!tab) return;

      const idx = tabs.indexOf(tab);
      let next;

      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          next = tabs[(idx + 1) % tabs.length];
          next.focus();
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          next = tabs[(idx - 1 + tabs.length) % tabs.length];
          next.focus();
          break;
        case "Home":
          e.preventDefault();
          tabs[0].focus();
          break;
        case "End":
          e.preventDefault();
          tabs[tabs.length - 1].focus();
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          activate(tab);
          break;
      }
    });
  }
}
