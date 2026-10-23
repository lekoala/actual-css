# Tokens

Tokens are CSS custom properties for colors, spacing, shape, type, and motion.
Override global tokens to restyle the whole system; use documented component
hooks for local changes.

## Public surface

Global tokens and documented component hooks are public API. Shared relays,
derived values, and properties written by JavaScript are internal.

Component pages list the useful hooks and their relationships. CSS source
headers classify properties as **Public hooks**, **Framework plumbing**, or
**Internal** and provide exact defaults and fallback chains.

### Where a token is declared

Use global tokens in application CSS. Component hooks are available only in
their component's scope: outside a card, `padding: var(--card-pad)` can silently
compute to `0`. Supply a fallback when reading a hook outside its component.

| Scope     | Declared on                 | Examples                               |
| --------- | --------------------------- | -------------------------------------- |
| Global    | `:root`, every theme island | `--space-40`, `--radius`, `--primary`  |
| Component | the component's base rule   | `--card-pad`, `--drawer-size`          |
| Relay     | a variant, state, or script | `--ui-bg`, `--intent`, `--surface-pad` |

Use relays only where documented, such as Button variants or `--bleed-pad`.
To match a bare panel to a card's padding:

```css
.panel {
  padding: var(--card-pad, var(--space-40));
}
```

### Which hooks inherit

A hook either describes one element's own layout, or a policy its context
hands down. Instance geometry stops at every new instance; policy inherits.

| Kind              | Examples                                  | Inherits |
| ----------------- | ----------------------------------------- | -------- |
| Palette, theme    | `--text`, `--primary`                     | yes      |
| Rhythm, density   | `--gap`, `--control-size`                 | yes      |
| Page policy       | `--center-size`, `--measure`              | yes      |
| Role policy       | `--form-actions-justify`, `--frame-ratio` | yes      |
| Instance geometry | `--cluster-justify`, `--grid-columns`     | no       |

Set instance geometry on the element itself, with a class or inline style.
Select nested instances explicitly to change them (`.toolbar > .cluster`).
Set inherited policies on a region or `:root`.

The layout hooks of `.switcher` and `.sidebar-layout` inherit because their
children consume them; check their component pages when nesting layouts.

### Color

Intent tokens are used by `.primary`, `.secondary`, `.success`, `.warning`, `.danger`, and `.neutral`. They are curated color/foreground pairs. Actual CSS does not compute foregrounds automatically in the core theme contract.

The values below are the light fallback. In browsers with `light-dark()` support, the default theme re-declares the same tokens as light/dark pairs so dark mode follows the OS automatically; without support, browsers receive the light fallback.

```css
:root {
  --primary: hsl(268 32% 33%);
  --primary-fg: hsl(0 0% 98%);
  --secondary: hsl(16 38% 38%);
  --secondary-fg: hsl(0 0% 98%);
  --success: hsl(150 40% 31%);
  --success-fg: hsl(0 0% 98%);
  --warning: hsl(36 68% 34%);
  --warning-fg: hsl(0 0% 98%);
  --danger: hsl(5 58% 43%);
  --danger-fg: hsl(0 0% 98%);
  --neutral: hsl(258 7% 43%);
  --neutral-fg: hsl(0 0% 98%);
}
```

Surface tokens describe the canvas and elevation model. Components should prefer these over hard-coded colors.

```css
:root {
  --surface: hsl(0 0% 100%);
  --surface-raised: hsl(0 0% 100%);
  --surface-subtle: hsl(262 24% 96%);
  --surface-solid: hsl(261 16% 13%);

  --text: hsl(261 20% 13%);
  --text-muted: hsl(259 9% 42%);
  --text-subtle: hsl(258 7% 57%);

  --border: hsl(260 15% 88%);
  --hover-overlay: hsl(260 20% 10% / 0.04);
}
```

The surface levels are: `surface` (canvas), `surface-raised` (cards, raised surfaces), `surface-subtle` (the working subtle level — for hover overlays, form fields, table headers), and `surface-solid` (the inverse surface, used for accent areas).

Surfaces are painted material and may be translucent. Two roles must stay opaque, so they have their own tokens, both defaulting to `--surface`:

- `--surface-solid-fg` — the ink on `--surface-solid`: tooltips, the status bar, an inverse band.
- `--surface-opaque` — an opaque neutral used where a component must hide or separate what is painted beneath it: the status-dot and avatar-stack rings, range-thumb and meter separators, step markers, the mask under an `.aura` child. It is not a surface fill; paint panels with `--surface-*`.

A theme with translucent surfaces overrides both with opaque values.

`--border` separates surfaces: cards, tables, dividers, panels. `--border-control`
is the resting edge that tells a control apart from the surface — fields,
checkboxes and radios, switches, OTP cells, choice cards, join addons, the color
and file inputs. It defaults to `--border`; set it alone to make controls
stand out (input border, field outline, form control contrast) without
darkening every separator. Hover, checked, invalid and disabled states keep
their own colors.

Use `*-fg` pairs only for solid backgrounds where the component controls both foreground and background. Do not require a foreground token for every surface token.

Focus uses an outline:

- Links, summaries, nav items, and menu items use `--focus-outline-color`.
- Text fields use `--focus` inside their border.
- Buttons, close controls, choices, and switches use `--focus` outside their border.

`--focus-ring-width` controls all these lines; `--focus-outline-offset` sets
the outside gap. Choose `--focus` with at least 3:1 contrast against both
`--surface` and `--surface-solid`. Forced colors use the system focus color.

```css
:root {
  --focus: hsl(268 30% 55%);

  --focus-outline-color: currentColor;
  --focus-outline-offset: 2px;
  --focus-ring-width: 2px;
}
```

The line is composed on the focused element, so a theme island or a region
that sets `--focus-ring-width` widens links and buttons alike. Set
`--focus-outline` to replace the whole generic line (`4px dashed currentColor`);
it has no default value. Application CSS that draws the generic line itself
writes `var(--focus-ring-width) solid var(--focus-outline-color)`.

### Palette coherence

Choose surfaces, text, borders, intents, and shadows as one palette. Neutrals
may share an ambient hue; success, warning, and danger should remain
recognizable. These relationships are set in the theme values, not derived
from `--primary` at runtime.

Keep structure and state understandable without color. A grayscale review can
help reveal where labels, shapes, or other cues are missing.

### Default theme philosophy

The default palette is **Ink & Terra**: a near-neutral aubergine `primary`, terracotta `secondary`, and pigment-toned statuses (sage, ochre, brick) tuned to equal perceived weight. The neutral ramp (text, borders, subtle surfaces) is tinted toward the primary hue so the whole page quietly carries the identity. Optional themes can re-introduce vivid intent palettes on top of this foundation.

Soft surfaces are generated from intent colors through `color-mix()`, in two
recipes that share one ink:

- **Tint** — the default `.badge` and `.alert`, and `.btn.soft`: a translucent
  intent laid over whatever surface is underneath, with no rim. It keeps
  separating on `--surface-subtle` and `--surface-raised`, where a fixed mix
  with `--surface` would match the surface it sits on.
- **Mix** — the shared `.soft` on zones (`.card`, `.chat-bubble`, `.navbar`,
  `.app-nav`): an opaque mix of `--surface` with the intent and a tinted rim.
  A zone may sit over an image, where a translucent fill would hand the text's
  contrast to whatever is behind it.

Themes tune both globally instead of rewriting component selectors:

```css
:root {
  --soft-bg-mix: 88%;     /* share of surface; the tint's opacity is 100% minus it */
  --soft-hover-alpha: 6%; /* extra intent share on hover */
  --soft-fg-mix: 100%;
}
```

`--soft-border-mix` has no default. Unset, the tint draws no rim and the mix
keeps a 65% one. A theme that sets it gives every soft treatment a tinted rim
of that weight — contoured badges and alerts, from one declaration:

```css
[data-theme="contoured"] {
  --soft-border-mix: 65%;
}
```

A rule that re-derives a soft color reads it with the recipe's own fallback:
`var(--soft-border-mix, 100%)` for a tint, `var(--soft-border-mix, 65%)` for a
mix. Both recipes are rendering-only — the baseline path below `color-mix()`
keeps `var(--surface-subtle)` and `var(--border)`.

`--soft-fg-mix` controls the share of intent color in soft text. Lower it to
move the text toward `--text` when a vivid or light intent lacks contrast.
Measure the result with `actual-css contrast`.

Soft ink can also be corrected per role. The intent classes relay a per-role
hook, and the soft recipe reads it before falling back to the global mix:

- `--primary-soft-fg`, `--secondary-soft-fg`, `--success-soft-fg`,
  `--warning-soft-fg`, `--danger-soft-fg`, `--neutral-soft-fg` — **theme hooks
  per role**; the ones whose palette needs a softer ink than the others.
- `--intent-soft-fg` — the **current relay** (framework plumbing), set by each
  intent class to its own `--*-soft-fg`.
- `--soft-fg-mix` — the **global fallback derivation**, unchanged.

The default theme's soft text meets 4.5:1 contrast on `--surface`,
`--surface-raised`, and `--surface-subtle`, at rest and on hover in both schemes.
Custom themes must check their own pairs:

```sh
bunx --bun actual-css contrast --theme src/theme.css
```

Named themes fall back to `--soft-fg-mix` unless they declare per-role hooks.

Set `--primary-soft-fg` to change soft primary text without changing other
intents. A custom intent class provides its soft foreground directly:

```css
.tertiary {
  --intent: var(--tertiary);
  --intent-fg: var(--tertiary-fg);
  --intent-soft-fg: var(--tertiary-soft-fg);
}
```

### Shape

Shape is intentionally small. Components can derive local radii from these.

```css
:root {
  --radius-sm: 0.25rem;
  --radius: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-full: 9999px;
  --border-width: 1px;
}
```

Do not create shape APIs like `.rounded`, `.pill`, or `.square` for every component. Prefer theme-level changes, for example a square theme can set all radius tokens to `0`.

### Spacing

Spacing should be useful without becoming a design-token encyclopedia.

```css
:root {
  --gap: 0.75rem;
  --space-10: 0.25rem;
  --space-20: 0.5rem;
  --space-30: 0.75rem;
  --space-40: 1rem;
  --space-50: 1.5rem;
  --space-60: 2rem;
}
```

Framework spacing names use multiples of 10. Intermediate names such as
`--space-15` and `--space-45` are reserved for application-defined steps.

Use `em` for spacing that should scale with the component text size, such as button gaps and inline padding. Use `rem` for global rhythm, layouts, and fixed density.

### Typography

Typography tokens cover the document baseline and common component needs.

```css
:root {
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  --font-width: 100%;

  --line-height: 1.5;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  --font-size-xs: 0.8125rem;
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem; /* base */
  --font-size-lg: 1.125rem;
}
```

Components can use local font variables for their own mapping, but should inherit by default. `--font-size-md` is the baseline — going smaller (`--font-size-sm` / `--font-size-xs`) is the easy direction; going larger adjusts line-heights and surrounding paddings, so prefer keeping base body text at `--font-size-md`.

### Controls

Controls share geometry so buttons, inputs, selects, and compact app UI align.
Local `.sm`/`.lg` sizes map `--control-size`, `--control-font-size`, and
`--control-pad-x`.

```css
:root {
  --control-size-sm: 2rem;      /* 32px → .sm */
  --control-size-md: 2.375rem;  /* 38px → default */
  --control-size-lg: 2.75rem;   /* 44px → .lg */
  --control-size: var(--control-size-md);
  --control-pad-x-sm: var(--font-size-xs); /* .sm, .compact */
  --control-pad-x-md: var(--font-size-md); /* default */
  --control-pad-x-lg: var(--font-size-lg); /* .lg, .spacious */
  --control-pad-x: var(--control-pad-x-md);
  --control-font-size: var(--font-size-md);
  --disabled-opacity: 0.65;
}
```

A theme sets the steps (`--control-size-*`, `--control-pad-x-*`); `.sm`/`.lg`
and `.compact`/`.spacious` select one. `--control-size` and `--control-pad-x`
are the selected values: override them on one instance, never in a theme,
where every size and density boundary would overwrite them.

A `data-theme` island inherits the selected values, so an override set above it
crosses it. A theme that changes the steps and is used as a nested island must
re-select them in its own block, from the step weights that size and density
classes set, so the island keeps the density around it:

```css
[data-theme="brand"] {
  --control-pad-x-sm: 0.5rem;
  --control-pad-x-md: 0.75rem;
  --control-pad-x-lg: 1rem;
  --control-pad-x: calc(
    (var(--control-pad-x-sm) * var(--control-step-sm)) +
    (var(--control-pad-x-md) * var(--control-step-md)) +
    (var(--control-pad-x-lg) * var(--control-step-lg))
  );
}
```

Re-select only the token whose steps the theme changes: the same rule for
`--control-size` would stop an inherited `--control-size` at the island.

`--control-pad-x` is a length, not an `em`: every part of one control must see
the same horizontal distance, and an `em` would change value on a descendant
with its own font size, which is exactly what `--input-icon-size` does to the
icon glyph.

- `.lg` — 44px control height
- default — 38px control height
- `.sm` — 32px control height

The default font size is `--font-size-md`; `.sm` maps it to `--font-size-sm` and
`.lg` to `--font-size-lg`. Density contexts change `--control-size` without
changing the font size.

Disabled controls and disabled-prone components read `--disabled-opacity` for their dimmed state — buttons, tabs, menu items, badges, avatars, choice cards, native inputs, and range sliders.

### Density

Density contexts swap shared rhythm and geometry, and never typography:

```css
.compact {
  --gap: var(--space-20);
  --density-space: var(--space-20);
  --control-size: var(--control-size-sm);
  --control-pad-x: var(--control-pad-x-sm);
}

.spacious {
  --gap: var(--space-50);
  --density-space: var(--space-50);
  --control-size: var(--control-size-lg);
  --control-pad-x: var(--control-pad-x-lg);
}
```

- **Size** (`.sm`, `.lg`) — typography + geometry, on one component.
- **Density** (`.compact`, `.spacious`) — rhythm + geometry, on a region.
- **Rhythm** (`.tight`, `.loose`) — `--gap` only, on a region.

Font size, icon size and font width stay put under density. A condensed table
or panel is a typographic choice: set `font-stretch` on it in the application.

Participation is opt-in and selective: controls consume `--control-size`
and `--control-pad-x` for geometry; spacing helpers and rhythms consume `--density-space` and `--gap`;
components whose size is intrinsic (badge, avatar, spinner, rating, key, prose,
inline choice/switch) keep their own scales. A local component size overrides
inherited density for the dimensions they share.

### Elevation

Use a tiny elevation surface. Components should not invent their own shadow scales.

```css
:root {
  --shadow: 0 1px 3px rgb(0 0 0 / 0.05), 0 4px 12px rgb(0 0 0 / 0.04);
  --shadow-popout: 0 0.25rem 0.75rem rgb(0 0 0 / 0.15);
}
```

With `color-mix()` support the shadows derive from `--shadow-color` (a theme token) and re-declare on every theme boundary so islands follow their own shadow color.

### Motion

Motion durations keep transitions consistent and easy to disable.

```css
:root {
  --duration: 150ms;          /* component transitions (hover/focus) */
  --duration-fast: 100ms;     /* quick feedback */
  --duration-slow: 200ms;     /* one-shot open/close */
  --duration-spin: 0.75s;     /* continuous spin (.spinner) */
  --duration-shimmer: 1.2s;   /* continuous shimmer (.skeleton, indeterminate .progress) */
  --ease-enter: cubic-bezier(0.2, 0, 0, 1);
  --ease-exit: cubic-bezier(0.4, 0, 1, 1);
}
```

Use `--ease-enter` and `--ease-exit` to change how dialogs, drawers, and the
status bar appear and leave. Ordinary state transitions, flyouts, tooltips,
and backdrops use CSS `ease`.

`reset.css` clamps raw animation and transition durations to `0.01ms`, resets their delays, and restores `html` scroll behavior under `prefers-reduced-motion: reduce`. Decorative loops effectively complete immediately without blanket-disabling animation support.

### Icons

Icons used by CSS-only controls are public tokens because users may need to replace them. They are inline SVG data URIs — override these URLs when a strict CSP disallows `data:`.

```css
:root {
  --icon-chevron: url("data:image/svg+xml,...");
  --icon-check: url("data:image/svg+xml,...");
  --icon-close: url("data:image/svg+xml,...");
  --icon-plus: url("data:image/svg+xml,...");
}
```

A single icon token can serve both `background-image` (native select) and `mask-image` (accordion, custom select) — the embedded stroke color is the fallback for image use; mask consumers provide their own color via `background-color`. Only add an icon token when CSS needs the icon. Markup icons should stay in markup.

### Composition tokens

A few cross-component helpers:

- `--indicator-offset` / `--indicator-ring` — positioning and contrast ring for a status dot attached to `.avatar > .badge:empty`.
- `--backdrop-color` / `--backdrop-opacity` / `--backdrop-fill` — scrim color and opacity shared by `dialog.modal::backdrop` and `dialog.drawer::backdrop`. Override `--backdrop-opacity` per theme for a denser or lighter scrim.

```css
:root {
  --indicator-offset: 14.65%;      /* circle-aware inset */
  --indicator-ring: var(--surface-opaque);
  --backdrop-color: rgb(0 0 0);
  --backdrop-opacity: 0.45;
  --backdrop-fill: rgb(0 0 0 / var(--backdrop-opacity));
}
```

Under `forced-colors: active`, `--backdrop-fill` maps to `Canvas`.

### Layering

Two systems order overlays, and only one of them uses numbers.

**The platform top layer** holds modal dialogs, drawers, and open popovers,
including runtime-managed flyouts, context menus, and tooltips. They appear
above the document, ordered by when they entered the top layer. `z-index`
does not change that order.

**The document layer** uses the scale below. Even a very high `z-index` stays
below the top layer.

| Token        | Value | Used by                         |
| ------------ | ----- | ------------------------------- |
| `--z-sticky` | 10    | `form-actions.sticky`, `topbar` |
| `--z-menu`   | 20    | `fab`, static `.flyout`         |
| `--z-status` | 60    | `status-bar`                    |

`.flyout` keeps the `--z-menu` declaration for a panel the runtime does not
manage — one the platform has not promoted still stacks by number.

The status bar sits above sticky bars and the FAB, and below the top layer.
For messages from a modal dialog, the runtime temporarily moves it inside the
dialog so the message remains visible and announced.

Document overlays can be confined by ancestor stacking contexts, such as those
created by `transform` or `isolation`. Top-layer overlays escape these contexts.
A panel or tooltip used in a modal dialog still needs to be authored inside
that dialog; promotion does not remove modal inertness.

Scrollbar gutter: modal open/close can shift page layout when the classic scrollbar disappears. When a measured scrollbar is present, `modal.css` applies `scrollbar-gutter: stable` to the viewport so the page doesn't jump.

## Internal tokens

The framework uses `--ui-*` and `--intent*` to connect variants and components.
Use the documented component hooks for ordinary customization.

## Theme contract

Themes override tokens, not selectors. The themes in `src/css/themes/` are repository-only demo examples, not included in the default stylesheet or the npm package; they exist to show valid ways to use this contract, such as `ocean`, `square`, `cyberpunk`, and `brutalist`.

A recolor theme sets intent pairs, surfaces, text, border, focus, hover overlay,
and shadow color. Check it with `bunx --bun actual-css contrast --theme FILE`;
the command exits 1 when a measured pair fails. In particular, `--focus` needs
3:1 contrast against both `--surface` and `--surface-solid` in every scheme.

The file can use `[data-theme]` or `:root`. The checker reads schemes through
`color-scheme`: express dark values with `light-dark()`. It does not measure
`prefers-color-scheme` media blocks.

When changing an intent, check its `--*-fg` and `--*-soft-fg` too. The contrast
report includes resting and hovered soft pairs for each intent and scheme.
Adjust failing roles with a per-role hook or a lower `--soft-fg-mix`.

The default palette's hooks apply to `:root` and to the `light`/`dark` boundaries only. Any other `data-theme` value resets them to the derivation, whether the attribute sits on `<html>` or on a nested island.

Contrast is measured between opaque colors. A translucent `--surface` has no ratio until it is composited over its backdrop, so `actual-css contrast` reports its pairs as n/a, and `.soft` mixes over it come out more opaque and more saturated than the surface. A translucent theme owns both: it measures against its real backdrop and replaces any recipe that does not hold there.

Shape, shadow, motion, typography, and soft-variant mix tokens are optional knobs. Override them only when the theme actually changes that part of the system.

A full theme can override:

- intent colors and foreground pairs
- surface, text, border, focus, and overlay colors
- `--surface-opaque` and `--surface-solid-fg`, when surfaces are translucent
- `--border-control`, when controls need a stronger edge than separators
- radius tokens
- optional shadow, motion, typography, and soft-variant mix tokens

A minimal recolor theme (illustrative, not a shipped theme):

```css
[data-theme="brand"] {
  color-scheme: light;

  --primary: hsl(260 70% 54%);
  --primary-fg: white;
  --secondary: hsl(190 70% 38%);
  --secondary-fg: white;
  --success: hsl(150 58% 34%);
  --success-fg: white;
  --warning: hsl(42 92% 52%);
  --warning-fg: hsl(35 35% 10%);
  --danger: hsl(355 72% 52%);
  --danger-fg: white;
  --neutral: hsl(250 8% 42%);
  --neutral-fg: white;

  --surface: hsl(260 45% 98%);
  --surface-raised: white;
  --surface-subtle: hsl(260 35% 94%);
  --surface-solid: hsl(260 28% 16%);

  --text: hsl(260 24% 14%);
  --text-muted: hsl(260 10% 42%);
  --text-subtle: hsl(260 8% 56%);
  --border: hsl(260 24% 84%);
  --focus: hsl(260 60% 62%);
  --hover-overlay: hsl(260 30% 10% / 0.04);
  --shadow-color: hsl(260 30% 10%);
  --soft-bg-mix: 84%;
  --soft-border-mix: 58%;

  --radius: 0.625rem;
  --radius-sm: 0.3125rem;
  --radius-lg: 0.875rem;
}
```

Derived tokens, including shadows, headings, selection colors, and state
colors, recompute at each theme boundary. To customize one, declare it in your
theme after Actual CSS.

Selected state has three roles:

- `--state-selected` — the selected fill or accent: a pressed button, a checked switch, a completed step.
- `--state-selected-fg` — ink on that fill.
- `--state-selected-text` — selected ink on a regular surface: the current nav link, the selected tab, the current step's number and ring.

`--state-selected-text` falls back to `--state-selected` within each theme.
Set it separately when the selected fill lacks contrast as text, especially
in a dark scheme. Mixing the accent toward `--text` can help:

```css
[data-theme="my-theme"] {
  --state-selected-text: light-dark(
    var(--primary),
    color-mix(in oklab, var(--primary) 50%, var(--text))
  );
}
```

`actual-css contrast` measures it on each surface (4.5:1 for text, 3:1 for the step ring).

Without `data-theme`, the default theme advertises `color-scheme: light dark` and follows the user's OS preference in browsers that support `light-dark()`. Dark themes should set `color-scheme: dark`. Light themes should set `color-scheme: light`. Browsers without `light-dark()` receive the light fallback.

Selects use the browser's native arrow under `prefers-contrast: more` and
`forced-colors: active`.

Under `prefers-contrast: more`, muted and subtle text use `--text`, and borders
and focus lines thicken. Keep these accessibility adjustments when customizing
a theme.

Under `prefers-reduced-transparency: reduce`, `.topbar` and `.form-actions.sticky` paint `--surface` without a backdrop blur. A theme with translucent `--surface-*` redeclares them opaque inside the same media query; the glass demo theme shows the recipe.

Under `forced-colors: active`, the browser automatically remaps `color`, `background`, and `border` properties to system colors. The core only adjusts what the remapping cannot express on its own — `--state-disabled` becomes `GrayText` and `--disabled-opacity` becomes `1` — declared on `:root` and `[data-theme]` so every theme boundary follows. Keep local forced-color rules only for custom control geometry, native bar parts, or selected/checked states that would otherwise be communicated only by background color.
