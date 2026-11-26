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
- **Finish is an image over a color.** `--btn-finish` is a `background-image`;
  `--btn-bg` stays a color, so one translucent value lights every intent, the
  hover changes the color under it, and the contrast audit measures the
  semantic pair under it. Variants without an opaque fill clear it.
- **Relief does not identify a control.** A recessed field keeps its
  `--border-control` edge; an inset shade or a fill step alone falls under
  3:1 (`surface-form.html` measures that case). A borderless theme either
  moves the edge (the lower edge alone, as `surface-form`'s Edge mode) or
  states the exception: `plush` keeps its wells borderless, `actual-css
  contrast` reports them, and the outline returns under increased contrast
  and forced colors.
- **Buttons keep `--btn-shadow`.** It applies to every variant, so a theme that
  raises its solid buttons scopes it to them; a ghost or a link never rises.

## Deferred

- `--surface-recessed`: Tactile recessed its wells with `--surface-subtle`
  placed between the canvas and the card. A dedicated surface waits for a theme
  where that ordering does not hold.
- `--card-shadow`: a `.card { box-shadow: var(--shadow) }` rule in the theme
  raised every card; no hook was needed.
- A finish on cards, switches or bars: no theme has asked for one yet.
- Shadow tokens in the design-tool export: the DTCG shadow type is not built
  yet, as for `--shadow`.
