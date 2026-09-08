# Contributing to Actual CSS

## Rendering invariants

Actual CSS should preserve meaning across alternate rendering environments
without inventing a second design system for them.

Two cases deserve explicit framework-wide rules:

- **Forced colors**: the user agent owns the palette. Actual only repairs
  structure or state that would otherwise disappear.
- **Print**: the application owns editorial intent. Actual only repairs
  framework-owned layout, decoration, motion, or fragmentation that would
  otherwise produce a broken or misleading printed result.

The common rule is simple: **preserve content and semantics first; intervene only
where the framework's own presentation would fail.**

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

| Situation                                               | Local forced-colors block?                               |
|---------------------------------------------------------|----------------------------------------------------------|
| Plain text / background / border                        | **No**                                                   |
| Native HTML control (`button`, `input`, `a`)            | **No by default**                                        |
| Focus                                                   | **Core only** (`focus.css`)                              |
| Decorative hover                                        | **No**                                                   |
| Intent color                                            | **No**                                                   |
| selected / current visible only by color                | **No by default; local FC repair only as a last resort** |
| `box-shadow` that was the only boundary                 | **Yes — replace with border/outline**                    |
| Custom checkbox / radio / switch with `appearance:none` | **Yes**                                                  |
| Dot / indicator drawn only by background                | **Yes**                                                  |
| Gradient / background-image carrying information        | **Yes**                                                  |
| `aria-disabled` on a non-native element                 | **Maybe**                                                |
| `forced-color-adjust: none`                             | **Exceptional, content-only**                            |

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

## Print invariant

Print is **not** a content-filtering mode owned by Actual CSS. The framework
must not decide that a component is irrelevant on paper merely because it is
interactive, floating, transient, or usually part of application chrome.

A button, modal, drawer, flyout, navigation item, status message, or spinner may
be meaningful in a printed document. Whether it should be omitted is an
application decision.

The governing rule:

> **Print styles in Actual may change presentation, but must not add or remove
> semantic content.**

It covers the whole class at once: hiding a component because it is interactive,
and augmenting output (for example printing a link's target URL after a `.btn`)
are both content policy, not presentation repair — so neither belongs in the
framework, and no per-exception list is kept.

### Principles

- **Do not hide semantic or interactive content by component type.**
  Avoid framework rules such as `.btn { display: none }`,
  `.flyout { display: none }`, or `dialog.modal[open] { display: none }`.
- Do not distribute a `.no-print` utility. Choosing what is excluded from a
  printed document belongs to the application; if an app wants one, it states
  that intent in its own CSS:

  ```css
  @media print {
    .no-print {
      display: none !important;
    }
  }
  ```

  The `!important` is defensible there precisely because it expresses the
  author's explicit choice rather than a framework default.
- Add print CSS only when it fixes a problem caused by Actual's own screen
  presentation.
- Prefer neutralizing layout constraints over replacing the component's
  appearance wholesale.
- Preserve visible state and meaning when print engines omit backgrounds or
  other decorative paint.
- Keep print repairs local to the component that owns the problematic
  presentation. `core/print.css` is for genuinely global print behavior.

### When a print block is allowed

| Situation                                                    | Framework print rule?                                  |
|--------------------------------------------------------------|--------------------------------------------------------|
| Component is interactive or transient                        | **No**                                                 |
| Button / link / navigation / flyout / modal / drawer          | **No by default**                                      |
| Application decides content should not print                  | **Application-owned**                                  |
| Viewport height or `overflow` would truncate printed content  | **Yes — neutralize the layout constraint**             |
| Fixed/sticky positioning would produce broken pagination      | **Yes — normalize positioning when needed**            |
| Box fragmentation would split an atomic component badly       | **Yes — use `break-inside` when it has a real effect** |
| Background removal would erase an essential boundary/state    | **Yes — add a printable structural fallback**          |
| Purely decorative backdrop/scrim has no semantic content      | **Yes — it may be neutralized or omitted**              |
| Animation/transition affects print rendering                  | **Yes — neutralize it**                                |
| Cosmetic print tweak with no concrete failure                 | **No**                                                 |

### Examples

A print repair is justified when an application shell uses viewport geometry
that would otherwise clip the document:

```css
@media print {
  .app-layout {
    display: block;
    block-size: auto;
    overflow: visible;
  }

  .app-layout > .app-main {
    overflow: visible;
  }
}
```

A print rule is **not** justified merely because a component is normally
temporary on screen:

```css
/* Avoid in framework code. */
@media print {
  .flyout,
  dialog.modal[open],
  dialog.drawer[open] {
    display: none;
  }
}
```

If an application does not want those elements in its printed output, it should
express that policy in application CSS.

### Review rule

Before adding any `@media print` or `@media (forced-colors: active)` block, ask:

1. **What information or geometry is actually lost without this rule?**
2. **Is the failure caused by Actual CSS rather than by application content?**
3. **Can the problem be fixed structurally in every rendering mode instead?**
4. **Does the rule preserve author intent rather than replace it?**

If there is no concrete failure to point to, do not add the exception.
