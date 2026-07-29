# Forced Colors (HCM) Strategy

## Principle: let the browser do the work

When `forced-colors: active`, the browser automatically remaps these properties to
the system palette:

- `border-color` → `ButtonText`
- `background` / `background-color` → `Canvas`
- `color` → `CanvasText`

This is the default behavior with `forced-color-adjust: auto` — and it applies to
**every** element, including pseudo-elements. Components do not need to redeclare
these properties in a forced-colors block.

## What the browser cannot understand

The browser sees `background-color`, `box-shadow`, `border-color` — it remaps
them all. It does **not** understand:

- `mask-image` (SVG masks applied via `background-color`)
- Pseudo-elements whose `background-color` is used as a mask fill
- `box-shadow` used as a focus ring (the browser drops them)

These are the **only** cases that need explicit forced-colors rules.

## Pattern: custom property + single override

```css
.component {
  --cmp-marker-color: var(--text-muted);

  background: ...
  color: ...
  border: ...
}

.component::marker {
  background-color: var(--cmp-marker-color);
  mask-image: url(...);
}

@media (forced-colors: active) {
  .component {
    --cmp-marker-color: CanvasText;
  }
}
```

## Color system keywords by role

| Context | Color | Why |
|---|---|---|
| Disclosure / accordion marker | `CanvasText` | Summary is on Canvas, not a button |
| Button, switch, checkbox | `ButtonText` / `ButtonFace` / `Highlight` / `HighlightText` | Interactive controls |
| Selected / current state | `Highlight` / `HighlightText` | Matches OS selection |
| Disabled state | `GrayText` | Standard disabled system color |
| Hover indicator | `ButtonText` outline or `CanvasText` underline | Avoids blocked backgrounds |

Prefer `CanvasText` for non-interactive mark-up content. `CanvasText` and
`ButtonText` are **not guaranteed identical** — custom HCM palettes can set
them differently.

## What to avoid

### `forced-color-adjust: none`
Only use when the color **must not** be remapped — e.g., a `background-color`
whose value is `currentColor` (the system would turn it into `Canvas` and make
the element invisible). Every `forced-color-adjust: none` blocks the browser
from fixing contrast issues automatically. Most components need zero instances.

### Redundant rules
```css
/* DON'T — the browser already does this */
@media (forced-colors: active) {
  .component {
    border-color: ButtonText;
    background: Canvas;
    color: CanvasText;
  }
}
```

### Redundant hover outlines
If the default focus is an outline on `:focus-visible`, it's already handled.
Hover doesn't need an outline duplicate. Reserve hover HCM rules for cases
where text-decoration (underline) is a better visual than an outline.

## Exemptions from forced-colors rules

Some components need **no** forced-color block at all because the default
remapping is perfect:

- `.card` — `background: Canvas`, `color: CanvasText` are already the defaults
- `.flyout` / `.menu` — `Canvas`/`CanvasText` for content, `ButtonText` for borders
- `.accordion` / `.breadcrumb` — pure remapping gets everything right
- `.status-bar` — `CanvasText` on `Canvas` background

The only forced-colors rules that should remain after a full audit are the ones
truly required by pseudo-element masks (`::after` / `::before` chevrons, custom
check/radio marks), non-native focus rings, and `currentColor` dependencies.
