# Actual CSS Specification

Actual CSS is a plain-CSS component framework with semantic classes, universal variants, small tokens, strong themes, and progressive modern color.

Contributor workflow is intentionally split:

- `ARCHITECTURE.md` defines where a change belongs.
- `QUALITY.md` defines how work is verified.
- local contract headers in `src/components/*.css` hold per-component invariants.

## Contract

- One official CSS file: `actual.css`.
- No mandatory `@layer`.
- No consumer build step.
- No bundled JavaScript.
- No web components for basic UI.
- No Tailwind dependency.
- No `.btn-primary` component-specific variant chains.

## Class Grammar

```txt
.component intent variant size state
```

Examples:

```html
<button class="btn primary soft lg">Save</button>
<span class="badge success outline">Published</span>
<div class="alert warning soft">Check this value</div>
```

The order is documented for readability. CSS should not depend on class order.

## Tokens

The public theme contract is intentionally small:

- intents: `--primary`, `--secondary`, `--success`, `--warning`, `--danger`, `--neutral`;
- foregrounds: `--primary-fg`, etc.;
- surfaces: `--surface`, `--surface-raised`, `--surface-subtle`, `--surface-solid`;
- text: `--text`, `--text-muted`, `--text-subtle`;
- structure: `--border`, `--focus`, `--radius`, `--radius-sm`, `--radius-lg`, `--gap`, `--duration`.

Foreground tokens are explicit. Automatic contrast is not the source of truth.

## Theming

Themes use `[data-theme]` and must redefine surfaces, text, borders, intents, foregrounds, and `color-scheme`.

```html
<link rel="stylesheet" href="actual.css">
<link rel="stylesheet" href="themes/corporate.css">
<html data-theme="corporate">
<section data-theme="dark">...</section>
```

Nested themes must work.

The base `actual.css` ships light defaults plus automatic system dark mode. Explicit named themes are separate files in `dist/themes/`: `dark`, `dim`, `corporate`, `forest`, `ocean`, `sunset`, `lavender`, `mono`, `square`. More themes are allowed only if they preserve contrast, surface quality, and the small token contract.

Themes may redefine shape tokens. For example, a square theme can set `--radius`, `--radius-sm`, and `--radius-lg` to `0`.

## Dark Mode

Explicit dark mode is core:

```html
<link rel="stylesheet" href="themes/dark.css">
<html data-theme="dark">
```

Automatic dark mode is included in `actual.css` and uses `prefers-color-scheme` only when no explicit root theme is present.

`light-dark()` is not required for the MVP.

## Modern Enhancements

Modern CSS is allowed only in centralized, non-critical enhancement files.

Allowed:

- `color-mix()` for soft and hover colors;
- container queries for component refinements;
- `prefers-color-scheme` for automatic dark mode.

Avoid:

- scattered `@supports` per component;
- mandatory `oklch(from ...)`;
- mandatory `@layer`;
- native nesting in distributed CSS.

## Component Taxonomy

Every component belongs to a category that determines its contract:

| Category | Intent colors? | Standard variants? | Components |
|---|---|---|---|
| **Action** | Required | Required (solid default) | `btn`, `badge` |
| **Feedback** | Required | Required (transparent default) | `alert` |
| **Surface** | No | Surface-only modifiers | `card`, `dialog` |
| **Input** | Validation-only | No | `input`, `textarea`, `select`, `check`, `radio`, `switch` |
| **Navigation** | Optional (active state only) | No | `navbar`, `tabs`, `breadcrumb`, `pagination` |
| **Data** | No | No | `table`, `metric`, `progress`, `divider` |
| **Decoration** | Optional (tint only) | No | `avatar`, `status`, `spinner` |

**Rules:**
- If a component accepts intents, it must accept all standard variants (no partial intent support).
- Inputs only accept intents for functional states (`.danger` for error, `.success` for valid). No decorative tinting.
- Surface components use shape/density/elevation modifiers, never intent or variant names.
- Navigation uses intents only for active/selected states, not for decorative coloring.

## Token Layers

```
LAYER 1 — Public Theme API (consumers override these)
  --primary, --primary-fg, --surface, --text, --radius, ...

LAYER 2 — Internal Intent Mapping (framework only)
  --intent, --intent-fg

LAYER 3 — Internal Variant Contract (framework only)
  --ui-bg, --ui-fg, --ui-border, --ui-hover-bg

LAYER 4 — Component Local (framework only)
  --btn-bg, --alert-pad, --card-radius
```

Only Layer 1 is public. Layers 2–4 are internal implementation details.

## Production MVP Components

- button;
- badge;
- alert;
- card;
- forms.

Each component must support local themes and predictable modifiers. Component-specific variant overrides are allowed when they refine shape, padding, or interaction while preserving the shared `--ui-*` contract. For example, `.badge.outline` may use a less pill-like radius than the default badge, while `.btn.outline` may keep button geometry.

## Layout Primitives

Production MVP includes a small set of layout helpers: `.center`, `.stack`, `.cluster`, `.grid`, `.sidebar`, and `.form-row`. These are compositional primitives, not a utility-first spacing system.

## Testing

The workflow is split between a fast inner loop and a full gate:

- `npm run verify` runs the fast contributor loop: lint, CSS architecture guards, and contract tests.
- `npm run verify:ci` runs the full gate: fast loop, build, and Playwright visual regression.

The scaffold includes a Playwright visual regression setup for the kitchen-sink demo at desktop and mobile viewport sizes. Visual snapshots are not required for consumers, but they are part of milestone and CI verification.

## Acceptance Criteria

- `dist/actual.css` works as a single linked stylesheet with base light and system dark.
- Explicit named themes work when their `dist/themes/*.css` files are loaded.
- `.btn.primary.soft`, `.badge.primary.soft`, and `.alert.primary.soft` share the same semantic meaning.
- Components are mobile-first.
- Container queries are enhancement only.
- Focus-visible styles are present for interactive controls.
- Docs include AI rules and copyable examples.
- Kitchen-sink demo covers components, states, sizes, themes, nested themes, and layout primitives.
- Fast verification exists at `npm run verify`.
- Full verification exists at `npm run verify:ci`.
