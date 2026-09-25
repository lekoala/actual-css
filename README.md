# Actual CSS

Plain CSS component framework for new projects. Semantic classes, shared variants, small tokens, theme hooks, and progressive enhancement.

Actual CSS claims a documented set of global class names; the package publishes
it as [`actual-css/reserved-classes.json`](reserved-classes.json).

For existing projects: use cascade layers, import order, or your own build-time
prefix transform.

## Install

```sh
npm install actual-css
```

### Import what you use

Copy the package's `src/css/actual.full.css` into your project as your entry,
rewrite its relative imports to package paths, and delete what you do not need
— see [Start from the full entry](docs/pages/guides/modular-import.md#start-from-the-full-entry):

```css
@import "actual-css/css";                   /* core */
@import "actual-css/css/layout";
@import "actual-css/css/forms/all";
@import "actual-css/css/components/button";
@import "actual-css/css/components/card";
@import "actual-css/css/utilities";
```

`actual-css/css` is the core (reset, tokens, theme, base, intents, variants,
focus, print). Family manifests (`css/layout`, `css/components`,
`css/typography`, `css/effects`, `css/utilities`) and their modules map
one-to-one to `src/css/`; `css/forms` is the exception — it points at the
native-controls base, with `css/forms/all` exposing the complete Forms family.
See the [modular import guide](docs/pages/guides/modular-import.md#family-manifests)
for the full map.

Flatten the composition for production with
`npx actual-css bundle src/app.css --out public/app.css --minify`. The CLI
resolves package subpaths and relative files, then inlines them without
transpiling modern CSS.

### Full bundle (zero-config)

The bare `actual-css` entrypoint and `actual-css/full` both resolve to the
complete compiled framework — useful for prototypes, CDN usage, or when bundle
size is not worth optimizing:

```css
@import "actual-css/full";
```

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/actual-css@0.10/dist/actual.full.min.css">
```

## Usage

Add classes to your HTML. Components define the structure, variants change the style, and intents set the color.

```html
<button class="btn">Click me</button>
<button class="btn primary">Save</button>
<button class="btn primary outline lg">Publish</button>
<button class="btn success soft sm">Confirm</button>
```

Intents such as `.primary`, `.secondary`, `.success`, `.warning`, and `.danger` work across components.

Variants such as `.solid`, `.soft`, `.outline`, and `.surface` are shared by components like buttons, badges, alerts, and cards. `.inverted` is a shared surface modifier: it paints any block with the inverse surface. `.ghost` and `.link` are button-only variants.

Size variants `.sm` and `.lg` scale typography and participating component
geometry consistently. Density contexts `.compact` and `.spacious` change
spacing and geometry without changing font size or icons; `.compact` may
slightly narrow typefaces that support a width axis.

## Public Class Grammar

Actual CSS uses a small unprefixed class grammar:

```text
.component [intent] [variant] [size] [modifier]
```

Components, layout helpers, form helpers, and utilities claim their documented class names. Intents are `.primary`, `.secondary`, `.success`, `.warning`, and `.danger`; shared variants are `.solid`, `.soft`, `.outline`, and `.surface`; `.inverted` is a shared surface modifier; button-only variants are `.ghost` and `.link`; shared sizes are `.sm` and `.lg`; density contexts are `.compact` and `.spacious`.

Undocumented `is-*` classes are runtime internals.

## What's included

**Components** — button, card, badge, alert, table, accordion, breadcrumb, pagination, skeleton, spinner, avatar, key, meter, progress, joined controls, and busy indicators.

**UI components** — dialog, drawer, flyout, tooltip, tabs, scrollspy, context menus, and other components that rely on JavaScript or modern platform behavior.

**Patterns** — actions, navbar, and overline. These are regular source files and can be imported only when needed.

**Layout primitives** — `.stack`, `.cluster`, `.grid`, `.switcher`, `.center`, `.media`, `.frame`, `.app-shell`, `.sidebar-layout`, and `.container-query`.

**Forms** — field layout, choices, switches, selects, custom selects, control base styles, validation states, and form actions.

**Prose** — opt-in rich text styling with `.prose`.

**Utilities** — spacing, gaps, logical margins, truncation, muted text, circles, screen-reader-only text, text wrapping, and link variants.

**Theme hooks** — public tokens for color, radius, shadow, motion, and typography. Reference presets in `src/css/themes/` are demo material, not default CSS or public package entrypoints.

## Modular CSS

The family manifests are the module catalog: `core`, `layout`, `typography`,
`forms`, `components`, `effects`, and `utilities` under `src/css/`, each with
an `index.css` manifest and per-module files. Import a manifest to get the
family, or a single file for one module. See the
[modular import guide](docs/pages/guides/modular-import.md#family-manifests)
for the full map of module names to import paths.

## JavaScript enhancers

Some components can be enhanced with JavaScript: dialog/drawer, flyout, tooltip, tabs, scrollspy, context menu, floating UI, opt-in `data-filter` input filtering, and input masks.

Presentation (`class`) and behaviour (`data-enhance`) are separate layers — import any primitive independently to build custom widgets. See [enhancement contract](docs/design-notes/enhancement-contract.md) and [widget primitives](docs/design-notes/widget-primitives.md).

Two ways to load it — pick one, never both, since each copy owns its own
registries:

* **Full runtime, zero-config** — every built-in enhancer, compiled:

  ```html
  <script src="https://cdn.jsdelivr.net/npm/actual-css@0.10/dist/actual.full.js" type="module"></script>
  ```

* **Your own build** — copy the package's `src/js/full.js` as your entry,
  rewrite its imports to package paths, keep the enhancers you need, and
  bundle it with your app:

  ```js
  import "actual-css/js";          // enhancement-manifest loader (optional)
  import "actual-css/js/dialog";
  import "actual-css/js/flyout";
  import "actual-css/js/tooltip";
  ```

Modular entrypoints map to source files and import `@lekoala/floating` as a bare specifier, so they need a bundler or an import map. JavaScript modules are safe to import during server-side rendering; outside a browser, registration is a no-op.

For project-specific behavior, use `actual-css/js/enhance` and the small input helpers rather than patching built-in modules. See the [progressive enhancement guide](docs/pages/guides/progressive-enhancement.md#extending-the-runtime) for custom filters, textarea autogrow, ajax forms, and htmx-like patterns.

## Distribution

* `dist/actual.full.css` — readable full-bundle CSS (every family).
* `dist/actual.full.min.css` — the full bundle, minified (`actual-css`, `actual-css/full`).
* `dist/actual.full.js` — the complete runtime, every built-in enhancer registered.

Only the full framework is compiled. To compose, import the sources:
`actual-css/css/*` for CSS, `actual-css/js/*` for JavaScript.

Modern syntax such as `light-dark()`, `color-mix()`, `@container`, `:has()`, `100dvh`, and `100vi` is preserved in the distributed files.

Actual CSS does not currently ship a separate compatibility build. It is designed as progressive enhancement: modern features are guarded with `@supports` where needed, while older browsers still receive the core styles and the layout, forms, and components.

For more conservative fallbacks, import and compose the source entrypoints directly.

## Browser support

Actual CSS is built around progressive enhancement.

| Tier        |  Firefox |  Safari | Chromium |
| ----------- | -------: | ------: | -------: |
| Degraded    |      78+ |     14+ |      88+ |
| **Minimal** | **125+** | **17+** | **116+** |
| Recommended |     129+ |   17.5+ |     123+ |

**Degraded** — semantic HTML and core CSS remain usable. JavaScript
enhancements are outside the supported contract.

**Minimal** — full Actual support, including the JavaScript runtime. The
runtime assumes modern browser APIs — including the native manual Popover
transport used by interactive surfaces — and does not ship legacy
compatibility layers or polyfills.

Degraded browsers may execute some enhancements successfully, but this
behavior is not tested or preserved.

## Cascade layers

Actual CSS is layer-compatible, not layer-dependent. The default `actual.css` file is unlayered. See [`docs/design-notes/cascade-layer.md`](docs/design-notes/cascade-layer.md) for details.

## AI Disclosure

Actual CSS uses AI-assisted tooling for code generation, refactoring, and debugging. Patterns and architecture come from hand-written prototypes and iterative human-driven refinement. AI output is reviewed, tested, and owned by the maintainer.

## Coding agents

Actual CSS ships a starter agent skill under [`skills/actual-css/`](skills/actual-css/).

It teaches coding agents how to use the framework's vocabulary, public hooks,
layout primitives and progressive enhancements without recreating framework
behavior in application CSS.

Copy it into your project's agent skills and extend it with your application's
theme, loaded modules and local conventions.

## License

MIT

## Docs

The documentation site is generated into [`site/`](site/) from the
source pages under [`docs/pages/`](docs/pages/). Start at
[`site/index.html`](site/index.html), or build it locally with
`bun run build:docs`.
