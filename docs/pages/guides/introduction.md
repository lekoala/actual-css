# Introduction

> Actual CSS is a plain CSS component framework for new projects — semantic classes, small tokens, universal variants, theme hooks, and progressive enhancement, with no build step and no framework dependency.

Actual CSS claims a small set of global class names and keeps everything opt-in:
components define structure, variants change the style, and intents set the
color. It is designed for new projects and can coexist in existing ones through
cascade layers, import order, or a project-owned build-time prefix transform.

## CSS-first philosophy

- CSS owns layout, surfaces, state styling, and transitions.
- JavaScript is optional and completes the interactive components — dialog,
  flyout, tooltip, tabs, scrollspy, status bar, and more.
- Semantic markup comes first; behavior is a progressive enhancement layered on
  top of it.
- Prefer native platform features when they fit, with small helpers where
  browser support or ergonomics need it.
- Markup stays understandable without JavaScript, and modern features are gated
  with `@supports` so older browsers keep the core layout and controls.

The distinction is structural, not stylistic: presentation lives in classes,
JavaScript behavior opts in through `data-enhance` tokens, semantics come from
ARIA and native HTML, and per-widget configuration uses self-describing
`data-*` attributes.

## Install

```text
npm install actual-css
```

Import the full framework in your CSS:

```css
@import "actual-css/full";
```

`actual-css/full` ships every functional family. The bare `actual-css` entrypoint
is the minimal core (reset, tokens, theme, base, intents, variants, focus,
print).

Or compose only the pieces you use:

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
`css/forms`, `css/components`, `css/typography`, `css/effects`,
`css/utilities`) and their modules map one-to-one to `src/css/`. See the
[modular import guide](modular-import.md) for the full map.

You can also use the compiled full bundle directly:

```html
<link rel="stylesheet" href="actual.full.min.css">
```

The package does not maintain separate partial bundles. Modular entrypoints map
to source files, so each project composes the framework shape it needs.

## Class grammar

Actual CSS uses a small unprefixed class grammar:

```text
.component [intent] [variant] [size] [modifier]
```

Intents are `.primary`, `.secondary`, `.success`, `.warning`, and `.danger`, and
work across components. Variants such as `.solid`, `.soft`, and `.outline` are
shared by buttons, badges, alerts, and cards; `.inverted` is a shared surface
modifier that paints any block with the inverse surface. `.ghost` and `.link`
are button-only. Size variants `.sm` and `.lg` scale controls consistently.
Undocumented `is-*` classes are runtime internals.

```html
<button class="btn">Click me</button>
<button class="btn primary">Save</button>
<button class="btn primary outline lg">Publish</button>
<button class="btn success soft sm">Confirm</button>
```

## The JavaScript runtime

Some components can be enhanced with JavaScript: dialog, drawer, flyout,
tooltip, tabs, scrollspy, context menu, floating UI, opt-in `data-filter` input
filtering, and input masks. Presentation and behavior are separate layers —
import the full runtime or any primitive independently to build custom widgets.

```html
<script src="actual.full.js" type="module"></script>
```

```js
import "actual-css/js/dialog";
import "actual-css/js/flyout";
import "actual-css/js/filter";
import "actual-css/js/mask";
```

JavaScript modules are safe to import during server-side rendering; outside a
browser, registration is a no-op. The complete runtime contract — lifecycle
rules, command routing, the floating and surface contracts, and how to extend
the runtime — is documented in [The JavaScript Runtime guide](progressive-enhancement.md).

## API surface

- **Layout** — the layout primitives: stack, cluster, grid, switcher, center,
  media, frame, app-shell, sidebar-layout, and more. See the
  [Layout overview](../layout/overview.md).
- **Components** — native and CSS-only component classes and examples: button,
  card, badge, alert, table, accordion, breadcrumb, pagination, skeleton,
  spinner, avatar, key, meter, progress, navbar, and more. Each component has
  its own page.
- **Forms** — field layout, controls, validation states, switches, selects,
  custom selects, and form actions. See the
  [Forms overview](../forms/overview.md).
- **Enhancements** — JS-enhanced component behavior: flyout, tooltip, tabs,
  scrollspy, and the status bar, each with its own page. See the
  [Enhancements overview](../enhancements/overview.md).
- **Guides** — [Migrating from Bootstrap](bootstrap.md) and
  [Migrating from Tailwind](tailwind.md) walk through moving an existing
  project; [The JavaScript Runtime](progressive-enhancement.md) documents the
  optional runtime that completes interactive components.

Beyond the pages, the repository keeps its design notes — browser support,
cascade layers, naming, the enhancement contract, and widget primitives — as
internal design documents for contributors.

## Browser support

Actual CSS is built around progressive enhancement.

| Tier         | Firefox | Safari    | Chromium |
|--------------|---------|-----------|----------|
| Degraded     | 78+     | 14+       | 88+      |
| **Minimal**  | **98+** | **15.4+** | **99+**  |
| Intermediate | 121+    | 16+       | 106+     |
| Recommended  | 129+    | 17.5+     | 123+     |

**Degraded** — semantic HTML and core CSS remain usable. JavaScript
enhancements are outside the supported contract.

**Minimal** — full Actual support, including the JavaScript runtime. The
runtime assumes modern browser APIs and ships no legacy compatibility layers or
polyfills.
