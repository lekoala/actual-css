# Tokens

The public theming surface — small, semantic global tokens that make the library easy to restyle without understanding every component's internals.

The surface stays small by keeping most tokens semantic, not component-specific.

- Global tokens are public API.
- Component-local tokens are implementation details unless documented by that component.
- Components should map global tokens to local variables internally.
- Themes override tokens, not selectors.
- Defaults must work without modern color features or build tooling.
- Modern enhancements can derive better values with `color-mix()`, `light-dark()`, or container queries.

## Public surface

Component custom properties fall into three header categories in the source: **Public hooks** (author-facing customization points), **Framework plumbing** (shared relays consumed across components — `--ui-*`, `--intent*`, `--density-*`), and **Internal** (derived, state/variant-owned, or runtime-written). Documentation focuses on discovering the right hook and on non-obvious usage; the CSS source remains canonical for exact defaults and fallback chains.

As a convention, component-prefixed properties owned by the component's base rule are usually author hooks. Properties owned by states/variants, derived from other hooks, or written by JavaScript are not. This convention is indicative, not algorithmic: runtime-written, derived, and state-relay properties stay internal even when their form resembles a hook.

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

The surface levels are: `surface` (canvas), `surface-raised` (cards, raised surfaces), `surface-subtle` (the working subtle level — for hover overlays, form fields, table headers), and `surface-solid` (the dark inverse surface, used for accent areas).

Use `*-fg` pairs only for solid backgrounds where the component controls both foreground and background. Do not require a foreground token for every surface token.

Focus styling is outline-first. `--focus` names the theme's focus color, and a ring is derived from it with `color-mix()`. A global focus baseline applies `--focus-outline` and `--focus-outline-offset`: older browsers show it on `:focus`, while modern browsers limit it to `:focus-visible`. Components add `--focus-ring-shadow` only where a softer halo helps; `--focus-ring-width` sets its thickness. Under `forced-colors: active`, the outline maps to `Highlight` and the shadow is disabled.

```css
:root {
  --focus: var(--neutral);

  --focus-outline-color: currentColor;
  --focus-outline: calc(var(--border-width) * 2) solid var(--focus-outline-color);
  --focus-outline-offset: 2px;
  --focus-ring-width: 3px;
  --focus-ring-shadow: 0 0 0 var(--focus-ring-width) var(--focus-ring);
}
```

### Default theme philosophy

The default palette is **Ink & Terra**: a near-neutral aubergine `primary`, terracotta `secondary`, and pigment-toned statuses (sage, ochre, brick) tuned to equal perceived weight. The neutral ramp (text, borders, subtle surfaces) is tinted toward the primary hue so the whole page quietly carries the identity. Optional themes can re-introduce vivid intent palettes on top of this foundation.

Soft surfaces (`.btn.soft`, `.badge.soft`, and the default `.alert`) are generated from intent colors through `color-mix()`. Themes can tune the mix globally instead of rewriting component selectors.

```css
:root {
  --soft-bg-mix: 88%;
  --soft-border-mix: 65%;
  --soft-hover-alpha: 12%;
  --soft-fg-mix: 100%;
}
```

`--soft-fg-mix` is the share of raw intent in soft *text*. At its `100%` default soft ink is the intent color itself, which is what a palette of dark, muted intents wants. A vivid or light palette cannot afford that: a soft badge then paints intent-tinted ink on an intent-tinted surface, and the two converge. Lowering the mix rebates the ink toward `--text`, which is the right direction in both schemes because `--text` is dark on a light theme and light on a dark one. Around `45%` a fully saturated palette recovers AA while the ink still reads as its intent.

**When an intent is tinted against a theme-controlled surface or border, the mix interpolates in `oklab`.** That covers the soft recipe, the checked `.choice-card` tint, and the `.overline.pill` border.

Not because rectangular interpolation is more faithful to the intent hue — across the shipped presets it is a few degrees *less* faithful. A browser treats hue as powerless below a small chroma epsilon, so for the low-chroma surfaces and borders the presets actually use, a polar mix snaps cleanly onto the intent and wins.

The reason is continuity. A theme owns `--surface` and `--border`, and may put them anywhere from achromatic to vivid. Under polar interpolation that range contains a cliff: below the epsilon the mix tracks the intent, above it the surface hue starts winning, and crossing it moves the result into a different color family — 116 degrees, a soft `.secondary` landing in the greens. Cartesian interpolation responds smoothly across the whole range a public token allows. A recipe that is only correct while an adopter's surface stays under an unstated, implementation-defined threshold is not a contract, so the framework trades a small continuous error for a predictable one. The present cost is imperceptible: the largest difference the rule introduces in any preset is 3/255 on one channel.

Mixing against `black`, `white`, `transparent`, or `currentColor` is exempt and stays in `oklch`: those have no hue to interpolate, so both spaces give byte-identical results. Polar interpolation also stays legitimate where hue rotation is the point, such as sweeping a gradient through hues. `bun run check:color-space` enforces the rule for contextual tints and takes an `intentional-oklch` comment as an escape hatch.

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

Official steps are named in tens so the scale stays extensible. **Actual CSS will never define a `--space-*` token that is not a multiple of 10.** The intermediate names (`--space-15`, `--space-45`, …) are reserved for application-level interpolation: defining them is not writing into the framework namespace, it is using the half of the scale the framework has permanently given up.

Use `em` for spacing that should scale with the component text size, such as button gaps and inline padding. Use `rem` for global rhythm, layouts, and fixed density.

### Typography

Typography tokens cover the document baseline and common component needs.

```css
:root {
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;

  --line-height: 1.5;
  --font-weight: 400;
  --font-weight-strong: 650;

  --font-size-xs: 0.8125rem;
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem; /* base */
  --font-size-lg: 1.125rem;
}
```

Components can use local font variables for their own mapping, but should inherit by default. `--font-size-md` is the baseline — going smaller (`--font-size-sm` / `--font-size-xs`) is the easy direction; going larger adjusts line-heights and surrounding paddings, so prefer keeping base body text at `--font-size-md`.

### Controls

Controls share sizing so buttons, inputs, selects, and compact app UI always align. `.sm`/`.lg` set shared density tokens for controls, compact labels, and spacing helpers.

```css
:root {
  --control-size-sm: 2rem;      /* 32px → .sm */
  --control-size-md: 2.375rem;  /* 38px → default */
  --control-size-lg: 2.75rem;   /* 44px → .lg */
  --control-size: var(--control-size-md);
  --control-pad-x: 1em;
  --control-font-size: var(--font-size-md);
  --disabled-opacity: 0.65;
}
```

- `.lg` — 44px control height
- default — 38px control height
- `.sm` — 32px control height

The font size stays at the baseline (`--control-font-size` = `--font-size-md`) in every density — density changes how much space controls consume, not how large their text is.

Disabled controls and disabled-prone components read `--disabled-opacity` for their dimmed state — buttons, tabs, menu items, badges, avatars, choice cards, native inputs, and range sliders.

### Density

Density modifiers swap the shared control geometry:

```css
.sm {
  --gap: var(--space-20);
  --density-space: var(--space-20);
  --control-size: var(--control-size-sm);
  --density-compact-size: 1.25rem;
}

.lg {
  --gap: var(--space-50);
  --density-space: var(--space-50);
  --control-size: var(--control-size-lg);
  --density-compact-size: 1.875rem;
}
```

Density covers spacing and geometry only — it never touches typography or icon size. Compact labels such as `.badge` consume `--density-compact-size`; display elements with special geometry, such as avatar and spinner, keep their own size scales. Content blocks like alert, card, dialog, table, and accordion do not participate.

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

Ordinary interaction/state transitions have **no easing token**: they use the CSS default `ease` directly, and the dialog shake feedback plus the `actual-dialog` View Transition keep that default deliberately. The presence pair exists only for one-shot open/close where open and closed states own separate transition declarations (`.status-bar`/`.is-open`, `dialog.modal[open]`, `dialog.drawer[open]`): `--ease-enter` decelerates the appearance, `--ease-exit` accelerates the departure. The pair follows Material's standard rhythm; the emphasized-decelerate entrance is deliberately not offered because it only pays off at 250–400ms durations, beyond this vocabulary. Backdrops keep `ease` — a scrim only fades, it does not travel — but track their surface's duration. Toggles that share one transition list at `--duration-fast` (flyout, tooltip) also stay on `ease`: at 100ms the curve barely resolves and entry/exit cannot split on a single rule. These absences are deliberate, not gaps; a theme with a different motion character overrides `--ease-enter` / `--ease-exit`.

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
- `--backdrop-color` / `--backdrop-opacity` / `--backdrop-fill` — scrim color and opacity shared by `dialog.modal::backdrop`, `dialog.drawer::backdrop`, and `.surface-backdrop`. Override `--backdrop-opacity` per theme for a denser or lighter scrim.

```css
:root {
  --indicator-offset: 14.65%;      /* circle-aware inset */
  --indicator-ring: var(--surface);
  --backdrop-color: rgb(0 0 0);
  --backdrop-opacity: 0.45;
  --backdrop-fill: rgb(0 0 0 / var(--backdrop-opacity));
}
```

Under `forced-colors: active`, `--backdrop-fill` maps to `Canvas`.

### Layering

A small z-index scale orders non-dialog overlays. Native `<dialog>` elements (modal, drawer) render on the platform top-layer, which has no numeric z-index and always paints above the page — they never compete with this scale.

| Token         | Value | Used by                                                                           |
|---------------|-------|-----------------------------------------------------------------------------------|
| `--z-sticky`  | 10    | Sticky page chrome (`form-actions.sticky`, `topbar`).                             |
| `--z-menu`    | 20    | Floating menus (`flyout`); `.surface-backdrop` sits at `calc(var(--z-menu) - 1)`. |
| `--z-tooltip` | 50    | Tooltips.                                                                         |
| `--z-status`  | 60    | `status-bar`.                                                                     |

Stacking-context traps: a flyout or tooltip that is a DOM descendant of a dialog, or of a container with `transform`, `filter`, `contain`, `isolation`, or `will-change`, is confined to that ancestor's stacking context. Its z-index token only orders it against siblings within that context. When a dialog's top-layer clips a descendant flyout, move the flyout markup outside the dialog or use a portal/popover to escape the stacking context.

Scrollbar gutter: modal open/close can shift page layout when the classic scrollbar disappears. When a measured scrollbar is present, `modal.css` applies `scrollbar-gutter: stable` to the viewport so the page doesn't jump.

## Internal tokens

Internal tokens are allowed when they reduce duplication or make component code clearer.

### Variant plumbing

The shared visual variants are:

- `.solid`: full background, paired foreground. This is the default for buttons.
- `.soft`: lightly tinted background, colored text. Good for alerts, badges, and secondary actions.
- `.outline`: transparent background, colored border and text.
- `.surface`: the page surface with the theme border, and the intent only in the text. The neutral chrome neither `.soft` (the intent-tinted treatment) nor `.outline` (no fill) can give.

Buttons also support two button-only variants:

- `.ghost`: transparent button with hover affordance.
- `.link`: button semantics with link presentation.

Do not force `.ghost` or `.link` onto components where the interaction model does not fit. Shared API should follow shared use.

Components map global tokens to local aliases once at the top of the component and consume local tokens afterwards:

```css
.btn {
  --btn-bg: var(--ui-bg, var(--btn-default-bg, var(--intent, var(--neutral))));
  --btn-fg: var(--ui-fg, var(--btn-default-fg, var(--intent-fg, var(--neutral-fg))));
  --btn-border: var(--ui-border, var(--btn-default-border, transparent));

  border: var(--border-width) solid var(--btn-border-color, var(--btn-border));
  border-block-end-color: var(
    --btn-border-block-end-color,
    var(--btn-border-color, var(--btn-border))
  );
  border-block-end-width: var(--btn-border-block-end-width, var(--border-width));
}
```

The `--btn-*` fallbacks are intentionally inherited extension points for themes that change button grammar — such as turning the default solid button into a surface button with an intent-colored lower edge (the `edge` theme does exactly this). Keep them local until the same need appears across multiple components.

Text controls (`.input`/`.textarea`/`.select`) expose the same lower-edge extension point: `--control-border-block-end-color` and `--control-border-block-end-width` are unset by default and fall back to the regular border, so a theme can give inputs an underline-style lower edge the same way, without fighting the hover/focus/disabled state rules that still own `--control-border` itself.

Alerts expose the same idea on the leading edge instead of the lower one: `--alert-border-inline-start-color` and `--alert-border-inline-start-width` are unset by default and fall back to the regular `--ui-border`, so a theme can turn an alert into a callout with a colored flag on the inline-start side, matching the classic notice pattern, without a per-variant override.

A theme is not limited to the tokens above; it can restate any component-local token under a state selector to change the interaction recipe itself, not just the palette. The `edge` theme does this for focus: the base input recipe (forms/control.css) flips `--control-border` to `--focus` on top of the shared outline + ring, which would stack with a lower-edge accent. Edge instead restores `--control-border` under `:focus-visible` and thickens the accent edge so the edge, not a second ring, carries the focus.

Buttons don't consume `--focus-outline` — button.css computes its own ring inline so the color can follow `--btn-focus-color` (intent-aware, unlike the plain `--focus`). It reuses the shared `--focus-ring-width` for the ring thickness and derives the color through `--btn-focus-ring-color` (a `color-mix()` of `--btn-focus-color` when supported, falling back to the shared `--focus-ring`).

Rules:

- Prefix internal component tokens with the component name (`--btn-*`, `--alert-*`, `--card-*`).
- Prefix shared variant plumbing with `--ui-*`.
- The shared relays `--ui-*`, `--intent*`, and `--density-*` are framework plumbing: they are classified once at framework level, not restated in every component file.
- Keep component-specific variants in component code when they do not generalize.
- Do not require users to override internal tokens for ordinary theming.
- Promote an internal token to public only when there is a repeated, reasonable customization need.
- A custom property used only in a fallback position (`var(--x, default)`) and never declared is an unset extension point and must carry a classification — public, framework plumbing, or internal. `check:css-api` fails on any unclassified fallback-only property; it does not force an artificial declaration to satisfy the audit.

## Theme contract

Themes override tokens, not selectors. The themes in `src/css/themes/` are repository-only demo examples, not included in the default stylesheet or the npm package; they exist to show valid ways to use this contract, such as `ocean`, `square`, `cyberpunk`, and `brutalist`.

A minimal recolor theme overrides the intent pairs, surfaces, text colors, border, focus, and hover overlay. In browsers with `color-mix()` support, the core derives `--focus-ring` from the island's `--focus`; override the ring only for a deliberate visual treatment or when a matching pre-`color-mix()` fallback is required.

Shape, shadow, motion, typography, and soft-variant mix tokens are optional knobs. Override them only when the theme actually changes that part of the system.

A full theme can override:

- intent colors and foreground pairs
- surface, text, border, focus, and overlay colors
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
  --focus: var(--primary);
  --hover-overlay: hsl(260 30% 10% / 0.04);
  --soft-bg-mix: 84%;
  --soft-border-mix: 58%;

  --radius: 0.625rem;
  --radius-sm: 0.3125rem;
  --radius-lg: 0.875rem;
}
```

Several tokens are theme-derived aliases that reference other tokens — `--state-selected`/`--state-selected-fg`/`--state-disabled`, `--indicator-ring`, `--shadow`/`--shadow-popout`, `--heading`, `--selection-bg`/`--selection-fg`, and `--focus-ring-shadow`. They are declared on `:root, [data-theme]` so they recompute on every theme boundary: a custom property resolves its `var()` references at computed-value time on the element that declares it, so an alias declared only on `:root` would be inherited as an already-resolved value and would not follow a `[data-theme]` island's overridden tokens. A theme that wants a distinct alias (e.g. a `--selection-bg` of its own) overrides it explicitly afterwards, which wins by cascade order.

Without `data-theme`, the default theme advertises `color-scheme: light dark` and follows the user's OS preference in browsers that support `light-dark()`. Dark themes should set `color-scheme: dark`. Light themes should set `color-scheme: light`. Browsers without `light-dark()` receive the light fallback.

Because the native select chevron is an SVG background image and cannot inherit `currentColor`, the select hands the arrow back to the browser under `prefers-contrast: more` (same treatment as `forced-colors: active`) instead of shipping a recolored chevron per theme — one native fallback covers every theme without a high-contrast icon variant to maintain.

Under `prefers-contrast: more`, the user's contrast preference wins over a theme's palette by contract: the core collapses `--text-muted`/`--text-subtle` to `--text` and thickens borders and focus so no theme can defeat a legibility requirement. This is a deliberate decision, not a specificity quirk — the repeated `[data-theme][data-theme]` attribute only outranks a preset theme stylesheet loaded after the core.

Under `forced-colors: active`, the browser automatically remaps `color`, `background`, and `border` properties to system colors. The default theme provides the few necessary system-color overrides for cases the browser cannot handle — `--focus-outline-color`, `--state-selected`/`--state-selected-fg`, `--state-disabled`, `--backdrop-fill`, and decorative shadow removal. Because that rule targets `:root` (which always matches regardless of `data-theme`) and the `[data-theme]` attributes, it reaches every theme. Components should inherit that baseline; keep local forced-color rules only for custom control geometry, native bar parts, disabled states, or selected states that would otherwise be communicated only by background color.

## Component mapping

Components map global tokens to local aliases at the top of the component, then use the local tokens afterwards. This makes the contract obvious:

```css
.alert {
  --alert-bg: var(--ui-bg, var(--surface-subtle));
  --alert-fg: var(--ui-fg, var(--intent, var(--text)));
  --alert-border: var(--ui-border, var(--border));

  border: var(--border-width) solid var(--alert-border);
  border-radius: var(--alert-radius, var(--radius-lg));
  background: var(--alert-bg);
  color: var(--alert-fg);
}
```

- theme authors adjust global tokens
- variant code adjusts `--ui-*`
- component code consumes local aliases

## Non-goals

- Do not expose a separate token for every selector.
- Do not mirror Pico-style component-specific variables unless there is a clear need.
- Do not add Tailwind-like color scales as public API.
- Do not rely on Sass, PostCSS, or generated token files.
- Do not make dark mode required for old browsers. Light mode is the fallback.
