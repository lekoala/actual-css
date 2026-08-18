# Customization

> Find the right lever when you want to change how a component or layout looks,
> without knowing in advance which custom property to use.

This is a problem-oriented index. It maps common intents to the public hooks and
primitives that express them, then points to the canonical section. It is not a
catalogue of every variable — the CSS source remains canonical for exact
defaults and fallback chains. See [Tokens → Public Surface](tokens.md#public-surface)
for the public/internal rule.

## I want to…

### Split / spread / put two items apart / one left, one right

Use `.cluster` with `--cluster-justify: space-between`. There is no separate
`.split` or `.spread` primitive.

→ [Layout → Cluster](layout.md#cluster)

### Align cluster items / top-align a toolbar row

Set `--cluster-align`.

→ [Layout → Cluster](layout.md#cluster)

### Change spacing without changing control size

Set `--gap` locally on the layout primitive. The optional `utilities-extra.css`
layer ships `.gap-sm` / `.gap-md` / `.gap-lg` for row/column containers.

→ [Layout](layout.md)

### Custom or asymmetric grid columns

Set `--grid-columns` on `.grid`. Use `--grid-min` to tune the responsive item
width.

→ [Layout → Grid](layout.md#grid)

### Rounded card / change a card's radius

Set `--card-radius`. `--card-pad` also drives `.bleed` offsets.

→ [Components → Card](components.md#card)

### Wider or narrower modal / dialog

Set `--modal-size`.

→ [UI → Modal](ui.md#modal)

### Resize a drawer or sidebar panel

Set `--drawer-size` for drawers, `--sidebar-layout-size` for sidebars.

→ [UI → Drawer](ui.md#drawer) · [Layout → Sidebar](layout.md#sidebar)

### Right- or center-align form actions

Set `--form-actions-justify` (and `--form-actions-align`).

→ [Forms → Form Actions](forms.md#form-actions)

### Customize a switch's size

Change `--switch-width`, `--switch-block-size`, and `--switch-knob-margin`;
knob size and travel are derived from them. Prefer `.sm` / `.lg` first.

→ [Forms → Switches](forms.md#switches)

### Dim disabled controls

Set `--disabled-opacity`. All disabled-prone components — buttons, tabs, menu
items, badges, avatars, choice cards, native inputs, and range sliders — read it
for their dimmed state.

### Loading / busy overlay on a container

Use `aria-busy="true"` with a direct last-child `.spinner`; tint the overlay with
`--busy-overlay-bg`.

→ [Components → Busy state](components.md#busy-state)

### Set card-rail item width in a scroll-snap row

Set `--scroll-snap-item-size`.

→ [Layout → Scroll Snap](layout.md#scroll-snap)

### Resize an avatar or its stack

Set `--avatar-size` / `--avatar-radius`; tune overlap with `--avatar-stack-overlap`
and `--avatar-stack-ring`.

→ [Components → Avatar](components.md#avatar)
