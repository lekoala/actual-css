# Contributing to Actual CSS

## Forced colors invariant

Forced colors mode (Windows High Contrast and its equivalents) is **owned by the
user agent**. Actual CSS only adds a *structural affordance* when an essential
state or geometry would otherwise disappear. Components must never repaint
themselves into a second forced-colors theme.

### Principles

- Add a **structural distinction that is meaningful in every mode first**
  (`font-weight`, a real border or geometry change, a positioned indicator).
  A local forced-colors repair block is the fallback, not the default.
- On non-interactive surfaces, a transparent `border` baseline becomes a visible
  boundary in forced colors (the UA renders `transparent` as a system color) at
  zero cost in the default theme. On focusable controls, never spend the
  `outline` channel on state: it belongs to focus.
- Never set `forced-color-adjust: none` except when the displayed color *is* the
  content (the native color swatch). Every other use is a smell.
- Let the browser recolor native controls (`button`, `input`, `select`, `a`).
  Do not redeclare `ButtonFace` / `CanvasText` / `LinkText` for them.

### When a forced-colors block is allowed

| Situation | Local forced-colors block? |
| --- | --- |
| Plain text / background / border | **No** |
| Native HTML control (`button`, `input`, `a`) | **No by default** |
| Focus | **Core only** (`focus.css`) |
| Decorative hover | **No** |
| Intent color | **No** |
| selected / current visible only by color | **No by default — structural distinction first; local FC repair only as a last resort** |
| `box-shadow` that was the only boundary | **Yes — replace with border/outline** |
| Custom checkbox / radio / switch with `appearance:none` | **Yes** |
| Dot / indicator drawn only by background | **Yes** |
| Gradient / background-image carrying information | **Yes** |
| `aria-disabled` on a non-native element | **Maybe** |
| `forced-color-adjust: none` | **Exceptional, content-only** |

### Categories

- **A — already real structure**: real border, native control chrome, text
  decoration, outline → let the UA do it.
- **B — visual-only structure**: box-shadow, gradient, transparent background +
  shadow, masked colored pseudo, background-only dot → do **not** remove blindly;
  add a baseline affordance or keep a minimal exception.
- **C — replaced control**: `appearance:none`, hidden native input, custom
  meter/progress/range/switch → a component-level exception is likely legitimate.
- **D — state expressed by an author color pair** (selected, current, pressed) →
  first add a structural distinction that works in every mode. Use a local
  forced-colors repair only when no natural structural affordance fits the
  component (e.g. a custom-drawn marker whose state would otherwise vanish).
  Never reuse the focus `outline` channel for state on a focusable control.

### State tokens

`--state-selected` / `--state-selected-fg` are normal theme tokens. In forced
colors they resolve to their theme value and are then forced by the browser; they
must **not** be overridden to `Highlight` / `HighlightText` inside the
`forced-colors` media query. The only forced-colors overrides for state are
`--state-disabled: GrayText` and `--disabled-opacity: 1`.
