# Actual CSS

Plain CSS component framework for new projects. Semantic classes, shared variants, small tokens, theme hooks, and progressive enhancement.

Actual CSS claims a small set of global class names. For existing projects: cascade layers, import order, or an optional prefix transform.

## Install

```sh
npm install actual-css
```

Import the full framework in your CSS:

```css
@import "actual-css";
```

Or import only the pieces you use:

```css
@import "actual-css/css/reset";
@import "actual-css/css/base";
@import "actual-css/css/tokens";
@import "actual-css/css/theme";
@import "actual-css/css/intents";
@import "actual-css/css/variants";
@import "actual-css/css/container";
@import "actual-css/css/layout";
@import "actual-css/css/grid";
@import "actual-css/css/components/button";
@import "actual-css/css/components/card";
@import "actual-css/css/forms";
@import "actual-css/css/components/flyout";
@import "actual-css/css/utilities";
@import "actual-css/css/components/join";
```

You can also use the compiled file directly:

```html
<link rel="stylesheet" href="actual.min.css">
```

## Usage

Add classes to your HTML. Components define the structure, variants change the style, and intents set the color.

```html
<button class="btn">Click me</button>
<button class="btn primary">Save</button>
<button class="btn primary outline lg">Publish</button>
<button class="btn success soft sm">Confirm</button>
```

Intents such as `.primary`, `.secondary`, `.success`, `.warning`, `.danger`, and `.neutral` work across components.

Variants such as `.solid`, `.soft`, and `.outline` are shared by components like buttons, badges, alerts, and cards. `.ghost` and `.link` are button-only variants.

Size variants `.sm` and `.lg` scale controls consistently.

## Public Class Grammar

Actual CSS uses a small unprefixed class grammar:

```text
.component [intent] [variant] [size] [modifier]
```

Components, layout helpers, form helpers, and utilities claim their documented class names. Intents are `.primary`, `.secondary`, `.success`, `.warning`, `.danger`, and `.neutral`; shared variants are `.solid`, `.soft`, and `.outline`; button-only variants are `.ghost` and `.link`; shared sizes are `.sm` and `.lg`.

Undocumented `is-*` classes are runtime internals.

## What's included

**Components** — button, card, badge, alert, table, accordion, breadcrumb, pagination, skeleton, spinner, avatar, key, meter, progress, joined controls, and busy indicators.

**UI components** — dialog, drawer, flyout, tooltip, tabs, scrollspy, context menus, and other components that rely on JavaScript or modern platform behavior.

**Patterns** — actions, list group, navbar, and overline. These are regular source files and can be imported only when needed.

**Layout primitives** — `.stack`, `.cluster`, `.grid`, `.with-sidebar`, `.switcher`, `.center`, `.media`, `.frame`, `.app-shell`, and `.container-query`.

**Forms** — field layout, choices, switches, selects, custom selects, control base styles, validation states, and form actions.

**Prose** — opt-in rich text styling with `.prose`.

**Utilities** — spacing, gaps, logical margins, truncation, muted text, circles, screen-reader-only text, text wrapping, and link variants.

**Theme hooks** — public tokens for color, radius, shadow, motion, and typography. Reference presets in `src/css/themes/` are demo material, not default CSS or public package entrypoints.

## Optional CSS

Actual CSS also ships optional entrypoints:

```css
@import "actual-css/css/layer";
@import "actual-css/css/optional/typography-fluid";
@import "actual-css/css/optional/scroller";
@import "actual-css/css/optional/utilities-extra";
```

* `layer` wraps Actual CSS in `@layer actual`.
* `typography-fluid` adds fluid display typography.
* `scroller` adds custom scrollbar styling.
* `utilities-extra` adds more helpers.

## JavaScript enhancers

Some components can be enhanced with JavaScript: dialog/drawer, flyout, tooltip, tabs, scrollspy, context menu, floating UI, opt-in `data-filter` input filtering, and input masks.

Use the full module:

```html
<script src="actual.js" type="module"></script>
```

Or import only the enhancers you need:

```js
import "actual-css/js/dialog";
import "actual-css/js/flyout";
import "actual-css/js/filter";
import "actual-css/js/mask";
import "actual-css/js/tooltip";
```

The package does not maintain separate partial bundles. Modular entrypoints map to source files, so each project can compose the framework shape it needs. To customize the full runtime, comment the imports you do not want in `src/js/index.js` and rebuild the JavaScript bundle. JavaScript modules are safe to import during server-side rendering; outside a browser, registration is a no-op.

For project-specific behavior, use `actual-css/js/enhance` and the small input helpers rather than patching built-in modules. See [JavaScript](docs/javascript.md) for custom filters, textarea autogrow, ajax forms, and htmx-like patterns.

## Distribution

* `dist/actual.css` — readable modern CSS.
* `dist/actual.min.css` — the same CSS, minified for production.

Modern syntax such as `light-dark()`, `color-mix()`, `@container`, `:has()`, `100dvh`, and `100vi` is preserved in the distributed files.

Actual CSS does not currently ship a separate compatibility build. It is designed as progressive enhancement: modern features are guarded with `@supports` where needed, while older browsers still receive core layout, forms, and components.

For more conservative fallbacks, import and compose the source entrypoints directly.

## Browser support

Actual CSS is built around progressive enhancement.

* **Degraded** — Firefox 78+, Safari 14+, Chromium 88+. Core layout, typography, forms, and components.
* **Minimum** — Firefox 98+, Safari 15.4+, Chromium 99+. Dialog, drawer, and top-layer behavior.
* **Intermediate** — Firefox 121+, Safari 16+, Chromium 106+. `:has()`, container queries, alert icon layout, and intent tints.
* **Recommended** — Firefox 129+, Safari 17.5+, Chromium 123+. `light-dark()`, `color-mix()`, and full theming.

## Cascade layers

Actual CSS is layer-compatible, not layer-dependent. The default `actual.css` file is unlayered. See [`docs/design-notes/cascade-layer.md`](docs/design-notes/cascade-layer.md) for details.

## AI Disclosure

Actual CSS uses AI-assisted tooling for code generation, refactoring, and debugging. Patterns and architecture come from hand-written prototypes and iterative human-driven refinement. AI output is reviewed, tested, and owned by the maintainer.

## License

MIT

## Docs

Start with [`docs/README.md`](docs/README.md).
