# Actual CSS

Plain CSS component framework for new projects. Semantic classes, shared variants, small tokens, theme hooks, and progressive enhancement.

Actual CSS claims a small set (see `reserved-classes.json`) of global class names. 

For existing projects: cascade layers, import order, or an optional prefix transform.

## Install

```sh
npm install actual-css
```

Import the full framework in your CSS:

```css
@import "actual-css/full";
```

`actual-css/full` ships every functional family. The bare `actual-css` entrypoint is the minimal core (reset, tokens, theme, base, intents, variants, focus, print).

Or import only the pieces you use:

```css
@import "actual-css/css";
@import "actual-css/css/layout";
@import "actual-css/css/components/button";
@import "actual-css/css/components/card";
@import "actual-css/css/forms";
@import "actual-css/css/components/flyout";
@import "actual-css/css/utilities";
```

`actual-css/css` is the minimal core. Family manifests (`css/layout`,
`css/components`, `css/typography`, `css/effects`, `css/utilities`) and
their modules map one-to-one to `src/css/`; `css/forms` is the exception —
it points at the native-controls base, with `css/forms/all` exposing the
complete Forms family. See the
[modular import guide](docs/pages/guides/modular-import.md) for the full map.

You can also use the compiled full bundle directly:

```html
<link rel="stylesheet" href="actual.full.min.css">
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

Variants such as `.solid`, `.soft`, and `.outline` are shared by components like buttons, badges, alerts, and cards. `.inverted` is a shared surface modifier: it paints any block with the inverse surface. `.ghost` and `.link` are button-only variants.

Size variants `.sm` and `.lg` scale controls consistently.

## Public Class Grammar

Actual CSS uses a small unprefixed class grammar:

```text
.component [intent] [variant] [size] [modifier]
```

Components, layout helpers, form helpers, and utilities claim their documented class names. Intents are `.primary`, `.secondary`, `.success`, `.warning`, and `.danger`; shared variants are `.solid`, `.soft`, and `.outline`; `.inverted` is a shared surface modifier; button-only variants are `.ghost` and `.link`; shared sizes are `.sm` and `.lg`.

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
[modular import guide](docs/pages/guides/modular-import.md) for the full map
of module names to import paths.

## JavaScript enhancers

Some components can be enhanced with JavaScript: dialog/drawer, flyout, tooltip, tabs, scrollspy, context menu, floating UI, opt-in `data-filter` input filtering, and input masks.

Presentation (`class`) and behaviour (`data-enhance`) are separate layers — import any primitive independently to build custom widgets. See [enhancement contract](docs/design-notes/enhancement-contract.md) and [widget primitives](docs/design-notes/widget-primitives.md).

Use the full module:

```html
<script src="actual.full.js" type="module"></script>
```

Or import only the enhancers you need:

```js
import "actual-css/js/dialog";
import "actual-css/js/flyout";
import "actual-css/js/filter";
import "actual-css/js/mask";
import "actual-css/js/tooltip";
```

The package does not maintain separate partial bundles. Modular entrypoints map to source files, so each project can compose the framework shape it needs. To customize the full runtime, comment the imports you do not want in `src/js/full.js` and rebuild the JavaScript bundle. JavaScript modules are safe to import during server-side rendering; outside a browser, registration is a no-op.

For project-specific behavior, use `actual-css/js/enhance` and the small input helpers rather than patching built-in modules. See [Progressive Enhancements](docs/pages/enhancements/overview.md) for custom filters, textarea autogrow, ajax forms, and htmx-like patterns.

## Distribution

* `dist/actual.css` — readable core CSS.
* `dist/actual.min.css` — the core, minified for production.
* `dist/actual.full.css` — readable full-bundle CSS (every family).
* `dist/actual.full.min.css` — the full bundle, minified for production.

Modern syntax such as `light-dark()`, `color-mix()`, `@container`, `:has()`, `100dvh`, and `100vi` is preserved in the distributed files.

Actual CSS does not currently ship a separate compatibility build. It is designed as progressive enhancement: modern features are guarded with `@supports` where needed, while older browsers still receive the core styles and the layout, forms, and components.

For more conservative fallbacks, import and compose the source entrypoints directly.

## Browser support

Actual CSS is built around progressive enhancement.

| Tier         | Firefox |    Safari | Chromium |
| ------------ | ------: | --------: | -------: |
| Degraded     |     78+ |       14+ |      88+ |
| **Minimal**  | **98+** | **15.4+** |  **99+** |
| Intermediate |    121+ |       16+ |     106+ |
| Recommended  |    129+ |     17.5+ |     123+ |

**Degraded** — semantic HTML and core CSS remain usable. JavaScript
enhancements are outside the supported contract.

**Minimal** — full Actual support, including the JavaScript runtime. The
runtime assumes modern browser APIs and does not ship legacy compatibility
layers or polyfills.

Degraded browsers may execute some enhancements successfully, but this
behavior is not tested or preserved.

## Cascade layers

Actual CSS is layer-compatible, not layer-dependent. The default `actual.css` file is unlayered. See [`docs/design-notes/cascade-layer.md`](docs/design-notes/cascade-layer.md) for details.

## AI Disclosure

Actual CSS uses AI-assisted tooling for code generation, refactoring, and debugging. Patterns and architecture come from hand-written prototypes and iterative human-driven refinement. AI output is reviewed, tested, and owned by the maintainer.

## License

MIT

## Docs

The documentation site is generated into [`site/`](site/) from the
source pages under [`docs/pages/`](docs/pages/). Start at
[`site/index.html`](site/index.html), or build it locally with
`bun run build:docs`.
