# Actual CSS

Plain CSS component framework. Semantic classes, universal variants, small tokens, strong themes, progressive enhancement.

## Install

```sh
npm install actual-css
```

Then import in your CSS:

```css
@import "actual-css";
```

Or grab the compiled file from `dist/actual.min.css` and link it directly:

```html
<link rel="stylesheet" href="actual.min.css">
```

## Usage

Add classes to your HTML. Components style themselves, variants switch the look, intents set the color.

```html
<button class="btn">Click me</button>
<button class="btn primary">Save</button>
<button class="btn primary outline lg">Publish</button>
<button class="btn success soft sm">Confirm</button>
```

Intents (`.primary`, `.secondary`, `.success`, `.warning`, `.danger`, `.neutral`) and variants (`.solid`, `.soft`, `.outline`, `.ghost`, `.link`) work across components — button, badge, alert, card.

Size variants `.sm` and `.lg` scale controls consistently.

## What's inside

**Components** — button, card, badge, alert, modal, drawer, navbar, table, accordion, breadcrumb, pagination, skeleton, spinner, avatar, meter, progress, list-group, eyebrow, surface, scroller, actions, busy, form-actions.

**Layout primitives** — `.stack`, `.cluster`, `.grid`, `.with-sidebar`, `.switcher`, `.center`, `.media`, `.frame`, `.app-shell`, `.grid-responsive`.

**Forms** — `.field` layout, `.choice` (checkbox/radio), `.switch`, `.select`, `.custom-select`, `.control` base, validation states.

**Prose** — opt-in rich text scope (`.prose`) with typographic scale, measure, lead paragraphs.

**Utilities** — spacing steps (`.py`, `.px`, `.gap-*`, `.mbs-*`, `.mbe-*`), `.truncate`, `.muted`, `.circle`, `.sr-only`, `.text-balance`, link variants.

**Themes** — auto dark mode via `light-dark()`. 8 theme packs: corporate, forest, ocean, sunset, lavender, mono, dim, square. Switch with `data-theme="dark"` or a theme name.

**JS enhancers** — dialog, menu, tooltip, tabs, scrollspy, context-menu, floating. Drop in `actual.js` and they auto-enhance via data-attributes.

```html
<script src="actual.js" type="module"></script>
```

## Browser support

Actual CSS is built as progressive enhancement. Features gate on `@supports` — older browsers get core layout, forms, and components without the bells.

- **Degraded** (`:is`, `:where`) — Firefox 78+, Safari 14+, Chromium 88+. Core layout, typography, forms, components.
- **Minimum** (`<dialog>`) — Firefox 98+, Safari 15.4+, Chromium 99+. Modal, drawer, top-layer.
- **Intermediate** (`:has`, containers) — Firefox 121+, Safari 16+, Chromium 106+. Container queries, alert icon grid, intent tints.
- **Recommended** — Firefox 129+, Safari 17.5+, Chromium 123+. `light-dark()`, `color-mix()`, full theming.

### Cascade layers

Actual CSS is layer-compatible, not layer-dependent. The default `actual.css` file is unlayered and works in the Degraded compatibility target.

Projects that intentionally use cascade layers can import Actual CSS into a low-priority layer:

```css
@layer actual, app, utilities, overrides;

@import "actual-css/css/layer";
```

Or wrap the default entrypoint yourself:

```css
@layer actual, app, utilities, overrides;

@import "actual-css/css" layer(actual);
```

Cascade layers require the Minimum compatibility target or above. Keep project-specific layer names in the application; Actual CSS only claims the optional `actual` layer.

## License

MIT
