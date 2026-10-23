# Theming

Find a common customization below, then follow the reference for examples and
hook details. See [Tokens](tokens.md) for global settings and the theme contract.

## I want to…

### Split / spread / put two items apart / one left, one right

Use `.cluster` with `--cluster-justify: space-between`. There is no separate `.split` or `.spread` primitive.

→ Layout · Cluster

### Align cluster items / top-align a toolbar row

Set `--cluster-align`.

→ Layout · Cluster

### Change spacing without changing control size

Set `--gap` on the layout primitive to retune it and everything nested. To change only that element's rhythm without reaching nested primitives, set the `gap` property instead.

→ Layout

### Custom or asymmetric grid columns

Set `--grid-columns` on `.grid`. Use `--grid-min` to tune the responsive item width.

→ Layout · Grid

### Rounded card / change a card's radius

Set `--card-radius`. `--card-pad` also drives `.bleed` offsets.

→ Components · Card

### Wider or narrower modal / dialog

Set `--modal-size`.

→ Components · Dialog

### Resize a drawer or sidebar panel

Set `--drawer-size` for drawers, `--sidebar-layout-size` for sidebars.

→ Components · Drawer · Layout · Sidebar layout

### Right- or center-align form actions

Set `--form-actions-justify` (and `--form-actions-align`).

→ Forms · Form actions

### Customize a switch's size

Change `--switch-width`, `--switch-block-size`, and `--switch-knob-margin`; knob size and travel are derived from them. `--switch-knob-inline-size` widens the knob into a capsule. To rescale the whole row of inline choices at once, use `.sm` / `.lg` on `.choice`, or set `--choice-control-size` directly — the checkbox, the radio, and the switch track all follow it. Density contexts leave inline choices alone.

→ Forms · Switch

### Dim disabled controls

Set `--disabled-opacity`. All disabled-prone components — buttons, tabs, menu items, badges, avatars, choice cards, native inputs, and range sliders — read it for their dimmed state.

### Customize focus beyond the ring / focus background, text and border

Use an application class with `:focus-visible` to change a button's fill, text,
and border while keeping its framework outline. Load the rule after Actual CSS:

```css
.settings-action.btn:focus-visible:not(:where(:disabled, [aria-disabled="true"])) {
  background: var(--surface-solid);
  color: var(--surface-solid-fg);
  border-color: var(--focus);
  /* Hover paints an inset shadow over the background. */
  --btn-hover-overlay: transparent;
}
```

```html
<button class="btn primary settings-action" type="button">Settings</button>
```

Focus and hover can be active together. The selector takes precedence over the
generic hover fill; `--btn-hover-overlay` removes its extra tint while
preserving any `--btn-shadow` elevation. Check keyboard focus both with and
without the pointer over the button, in each color scheme and in forced colors.
Keep the outline visible against the surrounding surface when changing colors.

→ [Button hooks](../components/button.md#css-hooks) · [Focus tokens](./tokens.md#color)

### Keep bare native controls on-theme / accent-color

Bare checkboxes, radios, ranges, and `<progress>` follow the theme through
`accent-color: var(--primary)`. Styled controls such as `.check`, `.radio`,
and `.range` use their own appearance.

→ Forms · Overview · Foundations · Tokens (theme contract)

### Store a theme name without applying it

`data-theme` applies a theme to the element and its subtree. To store a theme
name without applying it, use `data-theme-value` or a form control's `value`.

### Loading / busy overlay on a container

Use `aria-busy="true"` with a direct last-child `.spinner`; tint the overlay with `--busy-overlay-bg`.

→ Components · Card

### Set card-rail item width in a scroll-snap row

Set `--scroll-snap-item-size`.

→ Layout · Scroll snap

### Resize an avatar or its stack

Set `--avatar-size` / `--avatar-radius`; tune overlap with `--avatar-stack-overlap` and `--avatar-stack-ring`.

→ Components · Avatar

### Make a dark (or light) section / inverted, inverse, contrasting band

Put `data-theme="dark"` (or `"light"`) on the section, footer, navbar or card.
The island recomputes every token — surfaces, text, fields, validation,
intents, focus and native controls — so a form or a `.primary.outline` inside
it reads correctly. In a branded application, `[data-theme="light"]` and
`[data-theme="dark"]` are the scheme roles of your brand: redefine them after
Actual CSS and the island follows your palette.

```html
<footer data-theme="dark">…</footer>
<article class="card" data-theme="dark">…</article>
```

The island recomputes tokens but paints nothing. A `.card` paints its own
surface; any other element needs `background: var(--surface)` and
`color: var(--text)`, or its ink lands on the page theme's background. A
`<legend>` straddles its fieldset's border, outside the fieldset's surface, so
put the island on a wrapper, not on the `<fieldset>`.

Actual has no class that inverts only part of a subtree. When all you need is
a painted band with neutral content and filled buttons, write it in
application CSS and keep forms and intent ink out of it:

```css
.site-band {
  --heading: var(--surface-solid-fg);
  background: var(--surface-solid);
  color: var(--surface-solid-fg);
}
```

Transparent treatments (`.btn.outline`, `.ghost`, `.link`) and headings follow
that ink; fields, their labels and help text, and intent colors keep the page
palette, which nothing tunes for `--surface-solid`. Focus lines stay readable
there: the theme contract keeps `--focus` at 3:1 on `--surface-solid`.

→ Foundations · Tokens (theme contract) · Examples · Contrast contexts

### Scope a theme to one section / microtheme / theme island

Any `data-theme` value is an island, not only `light` and `dark`:
`<aside data-theme="promo">` paints its subtree with that theme, nested inside
the page theme, without changing the markup. The same painting rule applies as
for a dark section. A theme can change radius, typography, shadow and motion as
well as color.

→ Foundations · Tokens (theme contract)

### Dark mode toggle / theme switcher / remember the user's choice

The default theme follows the OS. Set `data-theme="light"` or `"dark"` on
`<html>` to force a scheme; remove the attribute to follow the OS again.
Build the switcher and store the preference in application code. Apply a saved
choice from an inline script in `<head>` to avoid a flash of the wrong scheme.

### Force light or dark on a theme that has both / theme and color scheme

With a single brand theme, `data-theme="light"` and `"dark"` already are that
choice once you redefine them as your brand's two schemes (see the dark section
above).

A named theme that pairs both schemes through `light-dark()` follows the OS. To
pin one scheme, set `color-scheme` on the element that carries `data-theme`,
inline or in a rule more specific than the theme's own. `color-scheme` is the
scheme axis and `data-theme` the design axis, so there is no separate
`data-color-scheme` attribute.

```html
<html data-theme="ocean" style="color-scheme: dark">
```

On an ancestor it has no effect: the theme declares its own `color-scheme` on
its boundary. Leave single-scheme themes (`color-scheme: dark` only) alone —
their tokens have one value, so forcing the other scheme only flips native
controls and scrollbars.

→ Foundations · Tokens (theme contract)

### Replace the palette with my own brand

Override the whole minimal recolor set (Tokens · Theme contract), not just
`--primary`. Every neutral of the default theme — surfaces, text, border,
`--neutral`, `--hover-overlay`, `--shadow-color` — is tinted toward the default
primary and never derived from `--primary` at runtime, so a partial override
leaves the default identity in the greys. `actual-css contrast` checks
contrast, not a leftover tint.

Soft ink is the other half. The default palette ships calibrated
`--*-soft-fg` hooks; any other theme falls back to the `--soft-fg-mix`
derivation, which is a single global percentage and therefore guarantees
nothing about your intents. Measure it, then lower `--soft-fg-mix` or declare
the per-role hooks for the intents that miss:

```sh
bunx --bun actual-css contrast --theme src/theme.css
```

It reads the theme in headless Chrome, in every scheme it declares, and exits 1
when a soft, focus, invalid-focus or inverse pair misses its threshold, so it
can gate a CI job.

Starting from a color scale (Tailwind `--color-zinc-*`, a brand ramp): map one
step per role rather than importing the scale.

→ Foundations · Tokens (theme contract) · Guides · Tailwind (Map the palette to theme roles)

### Use a custom font / webfont / typeface with a theme

Load fonts in the application stylesheet with `@font-face` or a font service.
Set `--font-sans` and `--font-mono` on `:root` so the type stays consistent
across theme changes and islands. Set a separate heading face directly in
application CSS:

```css
:root {
  --font-sans: "Space Grotesk Variable", system-ui, sans-serif;
}

:is(h1, h2) {
  font-family: "Archivo Black", var(--font-sans);
}
```

→ Examples · Neo-brutalist

### Use or adapt a preset palette

`src/css/themes/` holds example palettes (`ocean`, `spruce`, `neon`, `brutalist`, …) as
reference material to copy into your own `[data-theme]` island — they are demo
assets, not package entrypoints. Each sets the intent/surface/text tokens and
lets the core derive everything else.

- `gradient`: outer focus halos on fields.
- `neo-brutalist`: hard shadows, pastel fills, and plus-shaped accordion
  markers. Use it as a page skin: its rules cross nested theme boundaries.
- `material`: filled underline fields and pill buttons.
- `glass`: translucent surfaces over a backdrop. Keep `--surface-opaque` and
  `--surface-solid-fg` opaque, and check soft fills against the actual backdrop.
