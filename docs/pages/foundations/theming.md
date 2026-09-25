# Theming

Find the right lever when you want to change how a component or layout looks, without knowing in advance which custom property to use.

This is a problem-oriented index. It maps common intents to the public hooks and primitives that express them, then points to the canonical section. It is not a catalogue of every variable — the CSS source remains canonical for exact defaults and fallback chains. See the tokens page, Public surface section, for the public/internal rule.

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

Change `--switch-width`, `--switch-block-size`, and `--switch-knob-margin`; knob size and travel are derived from them. To rescale the whole row of inline choices at once, use `.sm` / `.lg` on `.choice`, or set `--choice-control-size` directly — the checkbox, the radio, and the switch track all follow it. Density contexts leave inline choices alone.

→ Forms · Switch

### Dim disabled controls

Set `--disabled-opacity`. All disabled-prone components — buttons, tabs, menu items, badges, avatars, choice cards, native inputs, and range sliders — read it for their dimmed state.

### Keep bare native controls on-theme / accent-color

Native controls that no component class restyles — a bare checkbox, radio, range, or `<progress>` — follow the theme through `accent-color: var(--primary)`, declared on `:root` and every `[data-theme]` island so each island recomputes it from its own palette. Component classes (`.check`, `.radio`, `.range`) paint their own rendering and do not read it.

→ Forms · Overview · Foundations · Tokens (theme contract)

### Store a theme name without applying it

`data-theme` is an active theme boundary on every element that carries it, not
a generic storage attribute. Use a different name such as `data-theme-value`,
or a form control's `value`, when the element should only hold a theme name.
Apply `data-theme` deliberately when that element and its subtree should paint
with the selected palette — a theme swatch is a useful example.

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

Actual has no class that inverts only part of a subtree. When all you need is
a painted band with neutral content and filled buttons, write it in
application CSS and keep forms and intent ink out of it:

```css
.site-band {
  --heading: var(--surface);
  background: var(--surface-solid);
  color: var(--surface);
}
```

Transparent treatments (`.btn.outline`, `.ghost`, `.link`) and headings follow
that ink; fields, their labels and help text, and intent colors keep the page
palette, which nothing tunes for `--surface-solid`. Focus lines stay readable
there: the theme contract keeps `--focus` at 3:1 on `--surface-solid`.

→ Foundations · Tokens (theme contract) · Examples · Contrast contexts

### Replace the palette with my own brand

Override the whole minimal recolor set (Tokens · Theme contract), not just
`--primary`. Every neutral of the default theme — surfaces, text, border,
`--neutral`, `--hover-overlay`, `--shadow-color` — is tinted toward the default
primary and never derived from `--primary` at runtime, so a partial override
leaves the default identity in the greys. `report:theme-contrast` checks
contrast, not a leftover tint.

Soft ink is the other half. The default palette ships calibrated
`--*-soft-fg` hooks; any other theme falls back to the `--soft-fg-mix`
derivation, which is a single global percentage and therefore guarantees
nothing about your intents. Verify with `bun run report:theme-contrast`, then
lower `--soft-fg-mix` or declare the per-role hooks for the intents that miss.

→ Foundations · Tokens (theme contract)

### Use or adapt a preset palette

`src/css/themes/` holds example palettes (`ocean`, `spruce`, `neon`, `brutalist`, …) as
reference material to copy into your own `[data-theme]` island — they are demo
assets, not package entrypoints. Each sets the intent/surface/text tokens and
lets the core derive everything else.

The `bootstrap-v6` example follows Bootstrap 6's blue palette, stronger subtle
surfaces, filled badges, and steady select hover; its focus is the core solid
line. Use `.badge.soft` for a subtle badge. It is a visual theme, not a
Bootstrap compatibility layer. The `gradient` example keeps a Bootstrap 4 style
outer halo on focused fields, for comparison. The `material` example restyles
fields as filled underlines with pill buttons — tokens plus three small rules,
and `.join` still needs no adaptation.
