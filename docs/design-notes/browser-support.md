# Browser support strategy

## Philosophy

Works everywhere, works best on modern browsers. Wide browser support (even older browsers, not IE 11).

- No compile or build step (just CSS).
- No post-processing — use browser prefixes when needed.
- CSS nesting is not used — code must be findable in the inspector. Rules are organized as if nesting were used, grouped together without nesting syntax.

## Baseline

| Feature area     | Baseline    | Progressive enhancement       |
|------------------|-------------|-------------------------------|
| Layout (flex, grid, position) | Baseline 2023 | —                  |
| CSS custom properties         | Baseline 2023 | —                  |
| `:has()`                      | Baseline 2023 | —                  |
| `color-mix()`                 | Baseline 2023 | Fallback flat color |
| `light-dark()`                | 2024+        | Manual theme override |
| `:user-invalid`               | 2024+        | `[aria-invalid]` attribute |
| `transition-behavior: allow-discrete` | 2024+ | Native dialog open/close |
| `appearance: base-select`     | 2024+        | Native `<select>` |
| `@starting-style`             | 2024+        | Instant appearance |
| View Transition API           | 2024+        | Dialog open/close transition |
| CSS Anchor Positioning        | Future       | JS positioning (`floating.js`) |

Core layout and visual tokens work on all Baseline 2023 browsers. Features marked
2024+ are gated with `@supports` or degrade gracefully through fallback values.

## Dark mode

Dark mode is for modern browsers only (light mode is the fallback otherwise).
Use `color-scheme: light dark` plus `light-dark()` for theme tokens so the
default theme follows the OS without `data-theme`. Explicit themes pin
`color-scheme` to light or dark.

## Progressive enhancement

Modern features are gated with `@supports`; unsupported browsers keep the core layout and controls.

- `color-mix(in oklch, ...)` — enhanced variant surfaces and hover states
- `appearance: base-select` — enhanced select picker on fine-pointer devices
- `backdrop-filter` — enhanced sticky form actions
- `transition-behavior: allow-discrete` — smooth dialog open/close
- `:has()` — button groups, alert icons, form label layout

### @supports usage

Use `@supports` positively (no `@supports not`) only when it protects a dependent group of rules or a real fallback/modern branch. Do not gate a single progressive declaration whose unsupported value is simply ignored by the browser, such as `text-wrap: balance`.

### color-mix fallbacks

Every `color-mix()` declaration needs a flat fallback outside `@supports` (older browsers drop the whole property, not just the function).

### Hover rules

Hover rules that change surface colors go inside `@media (hover: hover)`. `:active` feedback stays unguarded.

### forced-colors

The default theme maps public color, focus, and shadow tokens to system colors
inside `forced-colors: active`. Components should rely on those tokens first.
Use local forced-color rules only for shapes or states the token layer cannot
infer, such as custom checkbox/switch geometry, native progress/meter parts,
disabled affordances, tooltip arrows, or selected states otherwise expressed
only through background color.

### :has()

- Grouping works with `role="group"` and `:has()`: it is a progressive enhancement; UI should still be functional without it.
- Keep `:has()` out of selector lists that also contain legacy-safe selectors. Put the `:has()` branch in `@supports selector(...)` if necessary.
- Use `:has()` to improve simple structure, but do not turn it into a monolithic selector.
