/*
 * <theme-picker> — the demo pages' theme select, in one place.
 *
 *   <script src="../scripts/theme-picker.js" data-storage="my-key"></script>
 *   <theme-picker><select class="select sm fit" aria-label="Switch theme"></select></theme-picker>
 *
 * The element fills its empty <select> with System / Light / Dark and every
 * theme below, and sets or removes data-theme on <html>. `themes="a b"` narrows
 * the named list (an empty value leaves the schemes only). `data-storage` on
 * the script tag persists the choice under that key; loaded in <head>, the
 * saved theme applies before first paint. After each change the element fires
 * `theme-change`, which page code listens to instead of the select's own
 * `change` (that one runs before the theme is applied).
 *
 * THEMES mirrors src/css/themes/index.css; check:templates fails when it
 * drifts, and when a page hand-copies a <optgroup label="Themes"> list.
 */
(() => {
  const THEMES = [
    "indigo",
    "dim",
    "corporate",
    "bootstrap-v6",
    "forest",
    "ocean",
    "spruce",
    "petrol",
    "sunset",
    "lavender",
    "mono",
    "square",
    "brutalist",
    "edge",
    "cyberpunk",
    "neon",
    "gradient",
    "material",
  ];

  const KEY = document.currentScript?.dataset.storage;
  const root = document.documentElement;
  const valid = new Set(["light", "dark", ...THEMES]);

  const read = () => {
    try {
      return KEY ? (localStorage.getItem(KEY) ?? "") : "";
    } catch {
      return "";
    }
  };

  const store = (theme) => {
    if (!KEY) return;
    try {
      if (theme) localStorage.setItem(KEY, theme);
      else localStorage.removeItem(KEY);
    } catch {
      // Storage can be unavailable in privacy-restricted contexts.
    }
  };

  const apply = (theme) => {
    if (theme) root.dataset.theme = theme;
    else delete root.dataset.theme;
  };

  const saved = read();
  if (valid.has(saved)) apply(saved);

  const label = (name) => name.charAt(0).toUpperCase() + name.slice(1).replaceAll("-", " ");
  const option = (value, text) => Object.assign(document.createElement("option"), { value, text });

  class ThemePicker extends HTMLElement {
    connectedCallback() {
      // The select stays the layout item, so a page's flex, .fit and
      // hide-on-mobile rules keep addressing it as before the wrapper.
      this.style.display = "contents";
      // Upgraded from <head>, the element connects before its children parse.
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => this.#render(), { once: true });
      } else {
        this.#render();
      }
    }

    #render() {
      const select = this.querySelector("select");
      if (!select || select.options.length > 0) return;

      const subset = this.getAttribute("themes")?.split(/\s+/).filter(Boolean);
      const names = subset ? THEMES.filter((name) => subset.includes(name)) : THEMES;

      select.append(option("", "System"), option("light", "Light"), option("dark", "Dark"));
      if (names.length > 0) {
        const group = Object.assign(document.createElement("optgroup"), { label: "Themes" });
        group.append(...names.map((name) => option(name, label(name))));
        select.append(group);
      }

      // A theme this picker does not offer still shows as System; the saved
      // value is kept for the pages that do offer it.
      select.value = root.dataset.theme ?? "";
      if (select.value !== (root.dataset.theme ?? "")) select.value = "";

      select.addEventListener("change", () => {
        apply(select.value);
        store(select.value);
        this.dispatchEvent(new CustomEvent("theme-change", { bubbles: true, detail: select.value }));
      });
    }
  }

  customElements.define("theme-picker", ThemePicker);
})();
