# Elevation and finish

A theme changes how light falls on the interface without changing its colors.
Raised, flat and recessed parts, and the sheen on a fill, are tokens next to
the palette, not variants. The `tactile` theme is the stress test that sized
them.

## Four dimensions

Color, geometry, elevation and finish vary independently. Color and geometry
were already tokens. Elevation had one surface step (`--shadow`) and one
floating step (`--shadow-popout`); finish was only reachable by putting a
gradient where a color belonged.

## Decisions

- **Roles, not a scale.** `--shadow-control` lifts a part that moves on a
  rail; `--shadow-inset` sinks a field or a rail. A `sm`/`md`/`lg` ladder would
  name sizes and leave the theme to guess which component reads which.
- **Unset by default.** Both are `initial`, so every consumer falls back to the
  value it painted before: the default theme does not move. Tactile sets them
  on its root and every rail follows.
- **Shadow hooks are list items.** They share a `box-shadow` with selection
  rings, focus rings and the button hover overlay. `none` invalidates that
  whole list, so a theme flattens a role with `0 0 #0000`.
- **Finish is an image over a color.** `--finish` is a `background-image`;
  the fill stays a color, so one translucent value lights every intent, the
  hover changes the color under it, and the contrast audit measures the
  semantic pair under it. Parts without an opaque fill stay flat.
- **One finish for every solid fill.** A glossy button beside a matte checked
  box read as two themes, so buttons, checked choices, switch tracks, progress
  values and solid badges read the same token. Each consumer gates it by a
  declaration in its solid state, not by resetting the token, so it never
  stops inheriting at a component boundary.
- **Relief does not identify a control.** An inset shade or a fill step alone
  falls under 3:1 (`surface-form.html` measures that case). The core's quiet
  field edge is the same stated exception: `actual-css contrast` warns, and
  increased contrast and forced colors restore the 3:1 edge. `tactile` keeps
  the strong `--border-control` edge on its wells; `plush` keeps them
  borderless under the exception; an Edge treatment moves the 3:1 cue to the
  lower edge alone.
- **Buttons keep `--btn-shadow`.** It applies to every variant, so a theme that
  raises its solid buttons scopes it to them; a ghost or a link never rises.

## Deferred

- `--surface-recessed`: Tactile recessed its wells with `--surface-subtle`
  placed between the canvas and the card. A dedicated surface waits for a theme
  where that ordering does not hold.
- `--card-shadow`: a `.card { box-shadow: var(--shadow) }` rule in the theme
  raised every card; no hook was needed.
- A finish on cards, range fills and meters: the range fill is already a
  gradient split, and no theme has asked for the others.
- Shadow tokens in the design-tool export: the DTCG shadow type is not built
  yet, as for `--shadow`.
