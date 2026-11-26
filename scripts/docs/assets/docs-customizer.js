/*
 * Docs customizer — one versioned config drives the page, the copied CSS and
 * the share link.
 *
 * Loaded as a blocking script at the end of <head>, after the stylesheets: it
 * applies the saved config before the first paint, then binds the panel once
 * the document is parsed. The docs build imports the same file to render the
 * panel's options, so the axes are declared once.
 *
 * Invariants:
 * - The axes customize the Default theme only. A demo theme is a finished
 *   identity whose component rules (a pill button, a beveled card) outrank
 *   tokens; an adopter writes one theme, never stacks two. On a demo theme
 *   the axes stay saved but write nothing, and come back with Default.
 * - "default" on an axis writes no override: the core value wins.
 * - The page renders exactly the CSS that Copy CSS hands out (cssText): one
 *   generator, no second path for the export.
 * - Nothing here ships in the Actual CSS bundle.
 */
(() => {
  const VERSION = 1;
  const STORAGE_KEY = "actual-docs-customizer";
  const LEGACY_KEY = "actual-docs-theme";
  const OPEN_KEY = "actual-docs-customizer-open";
  const STYLE_ID = "docs-customizer-style";
  const PARAM = "customize";
  const SCHEMES = ["system", "light", "dark"];

  /* Two scopes. Radius, fields, elevation and finish follow tokens that every
     [data-theme] boundary re-declares (theme.css, tokens.css), so the override
     must reach islands too. Density and font stay on :root: re-binding the
     control size on every island would stop an inherited density at a
     palette-only island (tokens.css, Controls). */
  const SELECTORS = { theme: ":root,\n[data-theme]", root: ":root" };

  const inset = (share) =>
    `inset 0 1px 2px color-mix(in oklch, var(--shadow-color) ${share}%, transparent)`;
  const drop = (y, blur, share) =>
    `0 ${y}px ${blur}px color-mix(in oklch, var(--shadow-color) ${share}%, transparent)`;
  const hoverFill = "color-mix(in oklab, var(--surface-subtle) 92%, var(--text))";

  /* Every field option sets the whole hook set, so switching from Edge to
     Filled cannot leave Edge's lower edge behind. initial falls back to the
     core value (the hooks are read with a fallback); the resting edge is a
     token theme.css sets, so it is restated: the quiet --border. */
  const FIELD_RESET = {
    "--control-default-bg": "initial",
    "--control-default-border": "var(--border)",
    "--control-hover-border": "initial",
    "--control-hover-bg": "initial",
    "--control-border-block-end-color": "initial",
    "--control-border-block-end-width": "initial",
    "--control-shadow": "initial",
  };

  /* What increased contrast gives back to a quiet, edged or borderless field:
     the 3:1 edge on every side, as theme.css does for the core. Restated
     because these rules come after the core's. */
  const STRONG_EDGE = {
    "--control-default-border": "var(--border-control)",
    "--control-hover-border": "initial",
  };

  const AXES = {
    radius: {
      label: "Radius",
      scope: "theme",
      options: {
        square: {
          label: "Square",
          css: { "--radius-sm": "0", "--radius": "0", "--radius-lg": "0" },
        },
        small: {
          label: "Small",
          css: { "--radius-sm": "0.125rem", "--radius": "0.25rem", "--radius-lg": "0.375rem" },
        },
        medium: {
          label: "Medium",
          css: { "--radius-sm": "0.25rem", "--radius": "0.5rem", "--radius-lg": "0.75rem" },
        },
        large: {
          label: "Large",
          css: { "--radius-sm": "0.5rem", "--radius": "0.875rem", "--radius-lg": "1.5rem" },
        },
      },
    },
    /* Thicker only. --border-width is every edge (an unchecked box, an
       outline button, a card), so 0 would erase controls, not just frames:
       the field edge is the Fields axis. And an explicit 1px would undo the
       2px that increased contrast sets on :root. */
    borders: {
      label: "Borders",
      scope: "theme",
      options: {
        thick: { label: "Thick (2px)", css: { "--border-width": "2px" } },
      },
    },
    density: {
      label: "Density",
      scope: "root",
      options: {
        compact: {
          label: "Compact",
          css: {
            "--gap": "var(--space-20)",
            "--density-space": "var(--space-20)",
            "--control-size": "var(--control-size-sm)",
            "--control-pad-x": "var(--control-pad-x-sm)",
            "--control-step-sm": "1",
            "--control-step-md": "0",
            "--control-step-lg": "0",
          },
        },
        comfortable: {
          label: "Comfortable",
          css: {
            "--gap": "var(--space-30)",
            "--density-space": "var(--space-40)",
            "--control-size": "var(--control-size-md)",
            "--control-pad-x": "var(--control-pad-x-md)",
            "--control-step-sm": "0",
            "--control-step-md": "1",
            "--control-step-lg": "0",
          },
        },
        spacious: {
          label: "Spacious",
          css: {
            "--gap": "var(--space-50)",
            "--density-space": "var(--space-50)",
            "--control-size": "var(--control-size-lg)",
            "--control-pad-x": "var(--control-pad-x-lg)",
            "--control-step-sm": "0",
            "--control-step-md": "0",
            "--control-step-lg": "1",
          },
        },
      },
    },
    fields: {
      label: "Fields",
      scope: "theme",
      options: {
        /* Strong field identification: the 3:1 edge on every side. Default
           is the core's quiet edge. */
        framed: {
          label: "Framed",
          css: { ...FIELD_RESET, "--control-default-border": "var(--border-control)" },
        },
        edge: {
          label: "Edge",
          css: {
            ...FIELD_RESET,
            "--control-default-bg": "var(--surface-subtle)",
            "--control-default-border": "transparent",
            "--control-hover-border": "transparent",
            "--control-hover-bg": hoverFill,
            "--control-border-block-end-color": "var(--border-control)",
            "--control-border-block-end-width": "2px",
          },
          contrast: STRONG_EDGE,
        },
        /* Borderless: the fill alone marks the field, denser than
           --surface-subtle so it holds on a card. A known exception to the 3:1
           cue (elevation-and-finish.md): the edge returns under increased
           contrast, and forced colors paint the transparent border. */
        filled: {
          label: "Filled",
          css: {
            ...FIELD_RESET,
            "--control-default-bg": "color-mix(in oklab, var(--surface-subtle) 94%, var(--text))",
            "--control-default-border": "transparent",
            "--control-hover-border": "transparent",
            "--control-hover-bg": "color-mix(in oklab, var(--surface-subtle) 88%, var(--text))",
          },
          contrast: STRONG_EDGE,
        },
        recessed: {
          label: "Recessed",
          css: {
            ...FIELD_RESET,
            "--control-default-bg": "var(--surface-subtle)",
            "--control-hover-bg": hoverFill,
            "--control-shadow": inset(16),
          },
          contrast: STRONG_EDGE,
        },
      },
    },
    elevation: {
      label: "Elevation",
      scope: "theme",
      options: {
        /* Shadow roles enter box-shadow lists: flat is 0 0 #0000, never none. A
           flat popout keeps a hairline so a menu still separates. */
        flat: {
          label: "Flat",
          css: {
            "--shadow": "0 0 #0000",
            "--shadow-popout": "0 0 0 var(--border-width) var(--border)",
            "--shadow-control": "0 0 #0000",
            "--shadow-inset": "0 0 #0000",
          },
        },
        subtle: {
          label: "Subtle",
          css: {
            "--shadow": `${drop(1, 3, 5)}, ${drop(4, 12, 4)}`,
            "--shadow-popout": drop(4, 12, 15),
            "--shadow-control": "initial",
            "--shadow-inset": "initial",
          },
        },
        raised: {
          label: "Raised",
          css: {
            "--shadow": `${drop(1, 2, 10)}, ${drop(6, 16, 10)}`,
            "--shadow-popout": `${drop(4, 10, 12)}, ${drop(16, 36, 18)}`,
            "--shadow-control": `${drop(1, 1, 18)}, ${drop(1, 3, 12)}`,
            "--shadow-inset": inset(14),
          },
        },
      },
    },
    finish: {
      label: "Finish",
      scope: "theme",
      options: {
        matte: { label: "Matte", css: { "--finish": "none" } },
        satin: {
          label: "Satin",
          css: { "--finish": "linear-gradient(rgb(255 255 255 / 0.14), rgb(0 0 0 / 0.08))" },
        },
        gloss: {
          label: "Gloss",
          css: {
            "--finish":
              "linear-gradient(rgb(255 255 255 / 0.32), rgb(255 255 255 / 0.08) 50%, rgb(0 0 0 / 0.04) 50%, rgb(0 0 0 / 0.12))",
          },
        },
      },
    },
    font: {
      label: "Font",
      scope: "root",
      options: {
        system: { label: "System", css: { "--font-sans": "system-ui, sans-serif" } },
        inter: {
          label: "Inter",
          css: { "--font-sans": '"Inter Variable", system-ui, sans-serif' },
        },
        serif: { label: "Serif", css: { "--font-sans": "ui-serif, Georgia, serif" } },
        mono: { label: "Mono", css: { "--font-sans": "var(--font-mono)" } },
      },
    },
  };

  const DEFAULTS = Object.freeze({
    version: VERSION,
    theme: "default",
    scheme: "system",
    ...Object.fromEntries(Object.keys(AXES).map((axis) => [axis, "default"])),
  });

  /* Keeps known axes with known values; anything else falls back to the
     default, so an old link or a removed theme degrades to the theme's own
     rendering instead of a broken page. */
  function normalize(raw, themes = []) {
    const config = { ...DEFAULTS };
    if (!raw || typeof raw !== "object" || raw.version !== VERSION) return config;
    if (themes.includes(raw.theme)) config.theme = raw.theme;
    if (SCHEMES.includes(raw.scheme)) config.scheme = raw.scheme;
    for (const [axis, { options }] of Object.entries(AXES)) {
      if (Object.hasOwn(options, raw[axis])) config[axis] = raw[axis];
    }
    return config;
  }

  const isDefault = (config, key) => config[key] === DEFAULTS[key];
  const customizable = (config) => config.theme === DEFAULTS.theme;
  /* The keys that change the rendering: a demo theme ignores the axes. */
  const effective = (config) =>
    Object.keys(DEFAULTS).filter(
      (key) => key !== "version" && (customizable(config) || !Object.hasOwn(AXES, key)),
    );

  /* Share link value: the version, then the effective keys that differ from
     the default ("1,radius:large,font:serif"). Readable, and short. */
  function encode(config) {
    const parts = effective(config)
      .filter((key) => !isDefault(config, key))
      .map((key) => `${key}:${config[key]}`);
    return [VERSION, ...parts].join(",");
  }

  function decode(value, themes = []) {
    const [version, ...parts] = String(value ?? "").split(",");
    const raw = { version: Number(version) };
    for (const part of parts) {
      const [key, entry] = part.split(":");
      if (key && entry) raw[key] = entry;
    }
    return normalize(raw, themes);
  }

  const block = (selector, lines, indent = "") =>
    `${indent}${selector.replaceAll("\n", `\n${indent}`)} {\n${lines
      .map((line) => `${indent}${line}`)
      .join("\n")}\n${indent}}`;

  /* An option's css applies everywhere; its contrast css is what changes
     under prefers-contrast: more (an edge a quiet treatment gives back). */
  function overrides(config) {
    if (!customizable(config)) return "";
    const rules = { theme: [], root: [] };
    const more = { theme: [], root: [] };
    for (const [axis, { scope, options }] of Object.entries(AXES)) {
      // A missing or unknown value writes nothing, like "default": a config
      // saved before an axis existed still renders.
      const option = Object.hasOwn(options, config[axis]) ? options[config[axis]] : null;
      if (!option) continue;
      rules[scope].push(`  /* ${axis}: ${config[axis]} */`);
      for (const [property, value] of Object.entries(option.css)) {
        rules[scope].push(`  ${property}: ${value};`);
      }
      for (const [property, value] of Object.entries(option.contrast ?? {})) {
        more[scope].push(`  ${property}: ${value};`);
      }
    }
    const emit = (scopes, indent) =>
      Object.entries(scopes)
        .filter(([, lines]) => lines.length > 0)
        .map(([scope, lines]) => block(SELECTORS[scope], lines, indent));
    const contrast = emit(more, "  ");
    return [
      ...emit(rules, ""),
      ...(contrast.length
        ? [`@media (prefers-contrast: more) {\n${contrast.join("\n\n")}\n}`]
        : []),
    ].join("\n\n");
  }

  /* The one CSS text: rendered into the page and copied as is. Empty when
     there is nothing to copy: no override, or a demo theme. The header names
     the markup only when a scheme is pinned (Default pairs both). */
  function cssText(config) {
    const rules = overrides(config);
    if (!rules) return "";
    const scheme = config.scheme !== "system" ? config.scheme : null;
    const header = [
      `/* Actual CSS customizer, config v${VERSION}.`,
      scheme ? `   Markup: <html data-theme="${scheme}">` : "",
      "   Load this after Actual CSS. */",
    ]
      .filter(Boolean)
      .join("\n");
    return `${header}\n\n${rules}\n`;
  }

  function pairsSchemes(root) {
    const scheme = getComputedStyle(root).colorScheme;
    return scheme.includes("light") && scheme.includes("dark");
  }

  /* Sets the theme attribute first, reads whether that theme pairs both
     schemes (the stylesheets have loaded: a parser-blocking script waits for
     them), then pins the scheme and writes the CSS. Returns whether the theme
     pairs both schemes, for the panel. */
  function apply(config, doc = document) {
    const root = doc.documentElement;
    const named = config.theme !== "default";
    const scheme = config.scheme !== "system" ? config.scheme : null;
    const theme = named ? config.theme : scheme;
    if (theme) root.setAttribute("data-theme", theme);
    else root.removeAttribute("data-theme");
    root.style.removeProperty("color-scheme");
    const paired = !named || pairsSchemes(root);
    if (named && scheme && paired) root.style.colorScheme = scheme;

    let style = doc.getElementById(STYLE_ID);
    if (!style) {
      style = doc.createElement("style");
      style.id = STYLE_ID;
      doc.head.append(style);
    }
    style.textContent = cssText(config);
    return paired;
  }

  const storage = {
    read(key, store = localStorage) {
      try {
        return store.getItem(key);
      } catch {
        return null;
      }
    },
    write(key, value, store = localStorage) {
      try {
        if (value == null) store.removeItem(key);
        else store.setItem(key, value);
      } catch {
        // Private mode or blocked storage: the page still applies the config.
      }
    },
  };

  /* A shared link wins over the saved config and replaces it; the parameter
     is then dropped so a reload or a copied address does not reapply it. The
     theme select of earlier versions saved a bare name: it migrates once. */
  function load(themes) {
    const url = new URL(location.href);
    if (url.searchParams.has(PARAM)) {
      const config = decode(url.searchParams.get(PARAM), themes);
      save(config);
      url.searchParams.delete(PARAM);
      history.replaceState(history.state, "", url);
      return config;
    }
    const saved = storage.read(STORAGE_KEY);
    if (saved) {
      try {
        return normalize(JSON.parse(saved), themes);
      } catch {
        return { ...DEFAULTS };
      }
    }
    const legacy = storage.read(LEGACY_KEY);
    if (legacy) {
      storage.write(LEGACY_KEY, null);
      const config = normalize({ ...DEFAULTS, theme: legacy, scheme: legacy }, themes);
      save(config);
      return config;
    }
    return { ...DEFAULTS };
  }

  function save(config) {
    const changed = Object.keys(DEFAULTS).some((key) => !isDefault(config, key));
    storage.write(STORAGE_KEY, changed ? JSON.stringify(config) : null);
  }

  const api = { VERSION, AXES, DEFAULTS, normalize, encode, decode, cssText, apply };
  globalThis.ActualDocsCustomizer = api;

  if (typeof document === "undefined") return;

  const themes = (document.currentScript?.dataset.themes ?? "").split(" ").filter(Boolean);
  let config = load(themes);
  let paired = apply(config);

  /* --- Panel --- */

  const DESKTOP = "(min-width: 64rem)";

  function bind() {
    const panel = document.getElementById("docs-customizer");
    const form = panel?.querySelector("[data-docs-customizer-form]");
    if (!panel || !form) return;
    const triggers = [...document.querySelectorAll("[data-docs-customize]")];
    const preview = panel.querySelector("[data-docs-customizer-css]");
    const status = panel.querySelector("[data-docs-customizer-status]");
    const hint = panel.querySelector("[data-docs-customizer-scheme-hint]");
    const schemes = [...form.querySelectorAll('[name="scheme"]')];
    const axes = panel.querySelector("[data-docs-customizer-axes]");
    const axesHint = panel.querySelector("[data-docs-customizer-axes-hint]");
    const copyButton = panel.querySelector('[data-docs-customizer-action="copy"]');

    function render() {
      for (const [key, value] of Object.entries(config)) {
        const field = form.elements.namedItem(key);
        if (field && "value" in field) field.value = value;
      }
      const single = !paired;
      for (const radio of schemes) radio.disabled = single;
      if (hint) hint.hidden = !single;
      // A disabled fieldset still exposes its selects' values: the saved
      // axes survive a visit to a demo theme.
      const locked = !customizable(config);
      if (axes) axes.disabled = locked;
      if (axesHint) axesHint.hidden = !locked;
      const text = cssText(config);
      if (copyButton) copyButton.disabled = !text;
      if (preview) {
        preview.textContent =
          text ||
          (locked
            ? "/* A demo theme: copy its file from src/css/themes/. */"
            : "/* No overrides: Actual CSS as shipped. */");
      }
    }

    function update(next) {
      config = normalize(next, themes);
      paired = apply(config);
      save(config);
      render();
    }

    function announce(message) {
      if (!status) return;
      status.textContent = message;
      clearTimeout(announce.timer);
      announce.timer = setTimeout(() => {
        status.textContent = "";
      }, 2000);
    }

    async function copy(text, message) {
      try {
        await navigator.clipboard.writeText(text);
        announce(message);
      } catch {
        announce("Copy failed: select the text below instead.");
      }
    }

    form.addEventListener("change", () => {
      const next = { ...config };
      for (const key of Object.keys(DEFAULTS)) {
        const field = form.elements.namedItem(key);
        // A disabled radio group has no value: keep the saved scheme.
        if (field?.value) next[key] = field.value;
      }
      update(next);
    });

    form.addEventListener("click", (event) => {
      const action = event.target.closest("[data-docs-customizer-action]")?.dataset
        .docsCustomizerAction;
      if (action === "copy") copy(cssText(config), "CSS copied.");
      if (action === "share") {
        const url = new URL(location.href);
        url.hash = "";
        url.searchParams.set(PARAM, encode(config));
        copy(url.href, "Link copied.");
      }
      if (action === "reset") {
        update({ ...DEFAULTS });
        announce("Reset to Actual CSS as shipped.");
      }
    });

    /* Desktop keeps the page usable beside the panel: a non-modal dialog that
       only Escape closes, reopened on the next page. Phones get the modal
       drawer with its backdrop. */
    function open() {
      const desktop = matchMedia(DESKTOP).matches;
      panel.setAttribute("closedby", desktop ? "closerequest" : "any");
      if (panel.open) return;
      if (desktop) {
        panel.show();
        storage.write(OPEN_KEY, "1", sessionStorage);
      } else {
        panel.showModal();
      }
      for (const trigger of triggers) trigger.setAttribute("aria-expanded", "true");
    }

    panel.addEventListener("close", () => {
      storage.write(OPEN_KEY, null, sessionStorage);
      for (const trigger of triggers) trigger.setAttribute("aria-expanded", "false");
    });

    for (const trigger of triggers) {
      trigger.setAttribute("aria-expanded", "false");
      trigger.addEventListener("click", () => {
        if (panel.open && !panel.matches(":modal")) panel.close();
        else open();
      });
    }

    render();
    if (storage.read(OPEN_KEY, sessionStorage) && matchMedia(DESKTOP).matches) open();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();
})();
