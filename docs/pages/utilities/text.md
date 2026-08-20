# Text Helpers

Lightweight helpers for muted or secondary text without a full color scale.

## Class reference

| Class           | Kind    | Description                                              |
|-----------------|---------|----------------------------------------------------------|
| `.muted`        | Utility | Secondary text color.                                    |
| `.text-start`   | Utility | Logical start-aligned text; sets `--text-align`.         |
| `.text-center`  | Utility | Centered text; sets `--text-align`.                      |
| `.text-end`     | Utility | Logical end-aligned text; sets `--text-align`.           |
| `.text-balance` | Utility | Balanced line wrapping (`text-wrap: balance`).           |
| `.text-pretty`  | Utility | Pretty line wrapping (`text-wrap: pretty`).              |
| `.lead`         | Utility | Slightly larger, relaxed reading-introduction paragraph. |

## Muted

Use `.muted` for secondary text when no semantic element already carries the meaning.

```html demo
<p class="muted">Last updated June 12, 2026.</p>
```

```css
.muted {
  color: var(--text-muted);
}
```

Do not create a full text color utility scale. Intent colors belong to components and state, not arbitrary text decoration.

## Text alignment

Use `.text-start`, `.text-center`, or `.text-end` when a component or layout primitive does not already set alignment. These use logical properties so they follow the writing direction.

## Text wrap

`.text-balance` and `.text-pretty` opt elements outside `.prose` into balanced or pretty text wrapping. They are safe progressive enhancements: browsers that do not support a `text-wrap` value ignore that declaration and keep normal wrapping.

## Lead

`.lead` is a slightly larger, more relaxed reading-introduction paragraph (`1.125em`, `--line-height-relaxed`). Use it for introductory text in editorial surfaces. For fluid headline sizing, use `src/css/typography/fluid.css`.
