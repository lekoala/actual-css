# Spacing Helpers

Semantic step helpers for gap, padding, and margin — the most common inline-style escape hatches.

## Class reference

Base utilities:

| Class       | Description                                              |
| ----------- | -------------------------------------------------------- |
| `.gap-none` | `gap: 0` on the element itself.                          |
| `.py`       | Block (vertical) padding at the current density step.    |
| `.px`       | Inline (horizontal) padding at the current density step. |
| `.mbs`      | Block-start margin at the current density step.          |
| `.mbe`      | Block-end margin at the current density step.            |

Extra utilities:

| Class                       | Description                                   |
| --------------------------- | --------------------------------------------- |
| `.gap-sm`                   | `gap: var(--space-20)` — denser row rhythm.   |
| `.gap-md`                   | `gap: var(--space-40)` — default row rhythm.  |
| `.gap-lg`                   | `gap: var(--space-50)` — roomier row rhythm.  |
| `.padding-context`          | All-side padding at the current density step. |
| `.gap-context`              | `gap: var(--gap)`.                            |
| `.row-gap-context`          | `row-gap: var(--gap)`.                        |
| `.column-gap-context`       | `column-gap: var(--gap)`.                     |
| `.margin-inline-auto`       | Horizontally centers a block.                 |
| `.margin-inline-start-auto` | Pushes a block toward the inline end.         |
| `.margin-inline-end-auto`   | Pushes a block toward the inline start.       |
| `.margin-block-start-auto`  | Pushes content toward the block end.          |
| `.margin-block-end-auto`    | Pushes content toward the block start.        |

Spacing helpers follow the density context. The default step is
`--space-40` (1rem); the `.sm` context tightens it to `--space-20` (0.5rem)
and the `.lg` context loosens it to `--space-50` (1.5rem). All helpers read
`--density-space` and map to logical properties (`padding-block`,
`margin-block-end`, etc.) for writing-direction safety.

## Gap

Override the default gap from layout primitives (`.stack`, `.cluster`, `.grid`):

```html demo
<ul class="cluster">
  <li><a href="/about" class="btn ghost">About</a></li>
  <li><a href="/contact" class="btn ghost">Contact</a></li>
</ul>
```

- `.gap-none` → `gap: 0`

`.gap-none` sets the element's own gap directly and does not change `--gap`
for nested layouts. For a denser or roomier rhythm, use the `.sm` / `.lg`
density contexts or override `--gap` on the layout instance.

## Padding

Block (vertical) and inline (horizontal) padding. Values respond to the density context.

```html demo
<section role="tabpanel" class="py">
  Panel content with breathing room above and below.
</section>
```

- `.py` → `padding-block: var(--density-space)`
- `.px` → `padding-inline: var(--density-space)`

## Margin

Block-start and block-end margin for giving elements room:

```html demo
<h2 class="mbs">A section heading with space above</h2>
```

- `.mbs` → `margin-block-start: var(--density-space)`
- `.mbe` → `margin-block-end: var(--density-space)`

No `mbs-none` / `mbe-none` — use `margin: 0` via `.list-reset` for lists, or a layout primitive that already resets margins (`.stack > *`).

## CSS hooks

- `--density-space` — the step every padding and margin helper reads; `.sm` sets it to `--space-20`, default to `--space-40`, `.lg` to `--space-50`.
- `--gap` — base gap of layout primitives; read by the optional `.gap-context`, `.row-gap-context`, and `.column-gap-context` helpers.
