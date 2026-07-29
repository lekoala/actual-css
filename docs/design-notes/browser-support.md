# Browser support strategy

## Philosophy

Works everywhere, works best on modern browsers. Wide browser support (even older browsers, not IE 11).

- No compile or build step (just CSS).
- No post-processing — use only necessary browser-specific prefixes and engine hooks.
- CSS nesting is not used — code must be findable in the inspector. Rules are organized as if nesting were used, grouped together without nesting syntax. Exception: see [CSS nesting inside @supports](#css-nesting-inside-supports).

## Baseline

| Feature area     | Baseline    | Progressive enhancement       |
|------------------|-------------|-------------------------------|
| Layout (flex, grid, position) | Baseline 2023 | —                  |
| CSS custom properties         | Baseline 2023 | —                  |
| `:has()`                      | Baseline 2023 | —                  |
| `<dialog>` element            | Baseline 2023 | Below that: rudimentary shim (`dialog-fallback.js` + `dialog-fallback.css`, both standalone and omittable in custom builds), no top layer or focus trap |
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
- `:has()` — button groups, alert icons, disabled choice labels

### @supports usage

Use `@supports` positively (no `@supports not`) only when it protects a dependent group of rules or a real fallback/modern branch. Do not gate a single progressive declaration whose unsupported value is simply ignored by the browser, such as `text-wrap: balance`.

When a baseline declaration is already a valid fallback, prefer the normal cascade to an `@supports` wrapper. For example, older browsers keep the opaque surface here, while newer ones replace it with the translucent value:

```css
background: var(--surface);
background: color-mix(in oklch, var(--surface) 88%, transparent);
backdrop-filter: blur(1rem);
```

### CSS nesting inside @supports

The no-nesting rule protects browsers that predate CSS nesting (Chrome 112, Firefox 117, Safari 16.5). A block already gated behind a later feature can't be reached by any browser that lacks nesting, so the inspector-friendliness argument no longer applies — nest freely inside it. `appearance: base-select` (Chrome 133+) is the current example: everything inside that `@supports` block in `custom-select.css` uses `&`-nesting instead of repeating the `.select:not(...)` selector.

Check the gating feature's baseline against nesting's before relying on this: if a future gate ships on a browser older than nesting's baseline, flatten that block back out.

### Vendor prefixes and engine hooks

Keep a browser-specific prefix only when it reaches a still-relevant engine behavior that the standard property does not cover, or when it targets a browser-only native part. Examples include `-webkit-mask-*` where needed and pseudo-elements such as `::-webkit-scrollbar` or `::-webkit-progress-value`.

Do not retain a prefixed duplicate merely to preserve an optional visual enhancement on older browsers. If the unprefixed declaration or an earlier fallback keeps the component functional and legible, prefer the smaller rule set.

### color-mix fallbacks

Every `color-mix()` declaration needs a flat fallback outside `@supports` (older browsers drop the whole property, not just the function).

### Hover rules

Use `:hover` directly for standard interactive feedback (links, buttons, table rows,
form controls, menu items, tabs, badges). The browser already knows when `:hover` can
apply; guarding it behind `@media (hover: hover)` needlessly suppresses hover on hybrid
devices whose primary pointer is touch but that also have a mouse or trackpad.

Reserve `@media (hover: hover)` only when hover:

- reveals controls or content,
- triggers heavy animation,
- changes layout,
- or is part of an interaction specifically designed for a mouse.

`:active` feedback stays unguarded.

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

## Native-first audit (0.2)

`dialog.js`, `surface.js`, and the drawer keep the modern path thin
(`<dialog>` with `showModal` / `close`) and the fallback contained
(`dialog-fallback.js` shim). The JS runtime's baseline is far below
Chrome 130 / Safari 18: no `FocusTrap` or `ScrollBarHelper` shim deletion,
no `@property { inherits: false }` for utility locals. Every native-feature
removal must clear a stated floor — not follow a competitor's.
- Use `:has()` to improve simple structure, but do not turn it into a monolithic selector.
