# Browser support strategy

## Philosophy

Works everywhere, works best on modern browsers. Wide browser support (even older browsers, not IE 11).

- No compile or build step (just CSS).
- No post-processing — use browser prefixes when needed.
- CSS nesting is not used — code must be findable in the inspector. Rules are organized as if nesting were used, grouped together without nesting syntax.

## Dark mode

Dark mode is for modern browsers only (light mode is the default otherwise). Use `light-dark()` for theme tokens. Keep `@media (prefers-color-scheme)` only for the `color-scheme` declaration.

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

Components with visual state indicators must be checked in `forced-colors: active`; use local system-color rules instead of a central high-contrast stylesheet.

### :has()

- Grouping works with `role="group"` and `:has()`: it is a progressive enhancement; UI should still be functional without it.
- Keep `:has()` out of selector lists that also contain legacy-safe selectors. Put the `:has()` branch in `@supports selector(...)` if necessary.
- Use `:has()` to improve simple structure, but do not turn it into a monolithic selector.
