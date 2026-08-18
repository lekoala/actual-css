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

Set `--gap` locally on the layout primitive. The optional `utilities-extra.css` layer ships `.gap-sm` / `.gap-md` / `.gap-lg` for row/column containers.

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

Change `--switch-width`, `--switch-block-size`, and `--switch-knob-margin`; knob size and travel are derived from them. Prefer `.sm` / `.lg` first.

→ Forms · Switch

### Dim disabled controls

Set `--disabled-opacity`. All disabled-prone components — buttons, tabs, menu items, badges, avatars, choice cards, native inputs, and range sliders — read it for their dimmed state.

### Loading / busy overlay on a container

Use `aria-busy="true"` with a direct last-child `.spinner`; tint the overlay with `--busy-overlay-bg`.

→ Components · Card

### Set card-rail item width in a scroll-snap row

Set `--scroll-snap-item-size`.

→ Layout · Scroll snap

### Resize an avatar or its stack

Set `--avatar-size` / `--avatar-radius`; tune overlap with `--avatar-stack-overlap` and `--avatar-stack-ring`.

→ Components · Avatar