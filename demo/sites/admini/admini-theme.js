/*
 * Shared theme switcher wiring for the Admini demo.
 *
 * This file is intentionally loaded in <head>: the persisted theme is applied
 * immediately to avoid a flash of the default palette. The control itself is
 * bound once the DOM exists. Named themes are provided by the demo theme sheet.
 */

(() => {
  const KEY = "admini-theme";
  const root = document.documentElement;

  const readTheme = () => {
    try {
      return localStorage.getItem(KEY) ?? "";
    } catch {
      return "";
    }
  };

  const storeTheme = (theme) => {
    try {
      if (theme) {
        localStorage.setItem(KEY, theme);
      } else {
        localStorage.removeItem(KEY);
      }
    } catch {
      // Storage can be unavailable in privacy-restricted contexts.
    }
  };

  const applyTheme = (theme) => {
    if (theme) {
      root.dataset.theme = theme;
    } else {
      delete root.dataset.theme;
    }
  };

  const savedTheme = readTheme();
  applyTheme(savedTheme);

  const bind = () => {
    const select = document.getElementById("theme-switcher");
    if (!select) {
      return;
    }

    const values = new Set([...select.options].map((option) => option.value));
    const activeTheme = values.has(savedTheme) ? savedTheme : "";

    if (savedTheme && !activeTheme) {
      applyTheme("");
      storeTheme("");
    }

    select.value = activeTheme;
    select.addEventListener("change", () => {
      applyTheme(select.value);
      storeTheme(select.value);
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind, { once: true });
  } else {
    bind();
  }
})();
