# Flex Helpers

Small flex helpers for grow behavior and other one-line needs.

## Class reference

Base utilities:

| Class             | Description                                                         |
| ----------------- | ------------------------------------------------------------------- |
| `.grow`           | Makes an item take available flex space without overflowing.        |
| `.items-start`    | Aligns children to the block-start edge; sets `--items-align`.      |
| `.items-center`   | Centers children on the cross axis; sets `--items-align`.           |
| `.items-end`      | Aligns children to the block-end edge; sets `--items-align`.        |
| `.items-baseline` | Aligns children on their first text baseline; sets `--items-align`. |
| `.dot`            | Inline separator dot for metadata rows.                             |

Extra utilities:

| Class                            | Description                                             |
| -------------------------------- | ------------------------------------------------------- |
| `.justify-content-start`         | `justify-content: flex-start` on the element itself.    |
| `.justify-content-center`        | `justify-content: center` on the element itself.        |
| `.justify-content-end`           | `justify-content: flex-end` on the element itself.      |
| `.justify-content-space-between` | `justify-content: space-between` on the element itself. |
| `.flex-wrap`                     | `flex-wrap: wrap` on any flex container.                |
| `.flex-nowrap`                   | `flex-wrap: nowrap` on any flex container.              |

## Grow

Use `.grow` when one item in a flex layout should take available space without overflowing.

```html demo
<header class="cluster">
  <strong>Actual CSS</strong>
  <nav class="grow" aria-label="Main navigation">
    <a href="#">Docs</a>
    <a href="#">Components</a>
  </nav>
  <button class="btn ghost" type="button">Menu</button>
</header>
```

```css
.grow {
  flex: 1 1 auto;
  min-inline-size: 0;
}
```

## Item alignment

Use `.items-start` on flex or grid layouts when children should keep their natural height and align to the block-start edge. This is especially useful for form fields in a grid, where the default grid stretch would make short fields as tall as taller neighbors.

```html demo
<div class="grid items-start">
  <label class="field">
    <span class="field-label">Name</span>
    <input class="input" type="text" />
  </label>
  <label class="field">
    <span class="field-label">Notes</span>
    <textarea class="textarea"></textarea>
  </label>
</div>
```

Use `.items-center` when a flex or grid layout should center its children on the cross axis. Use `.items-end` when children should align to the block-end edge.

Use `.items-baseline` when a row mixes text sizes — a price and its period, a name and a timestamp — so the words share one line instead of their boxes sharing a center.

```html demo
<p class="cluster items-baseline">
  <strong style="font-size: 2rem">$29</strong>
  <span class="muted">/ month</span>
</p>
```

These helpers work by setting a custom property that participating components read,
so they also apply inside a component's own grid anatomy rather than only on plain
flex containers:

- `.items-start` / `.items-center` / `.items-end` / `.items-baseline` set `--items-align`, read by `.alert` and `.card`.
- `.text-start` / `.text-center` / `.text-end` set `--text-align`, read by `.table` cells.

`.justify-content-*` and `.flex-wrap` / `.flex-nowrap` (utilities/extra) set the property
directly, so they never reach a nested `.cluster`.

Set the property directly when you need a value the helpers do not ship.

## Metadata separator

> A small inline dot for separating facts in a metadata row.

Use `.dot` between short facts in a byline, timestamp row, or breadcrumb-like list of details — anywhere a plain `·` character would otherwise be typed as text (which screen readers announce awkwardly).

```html demo
<p class="cluster" style="--cluster-justify: flex-start;">
  <span>Ada Meridian</span>
  <span class="dot" aria-hidden="true"></span>
  <time datetime="2026-06-12">June 12, 2026</time>
  <span class="dot" aria-hidden="true"></span>
  <span>8 min read</span>
</p>
```

```css
.dot {
  flex: none;
  inline-size: 0.25rem;
  block-size: 0.25rem;
  border-radius: var(--radius-full);
  background: var(--text-subtle);
}
```

Always mark it `aria-hidden="true"` — it is a visual separator, not content.

## CSS hooks

- `--items-align` — cross-axis alignment, set by the `.items-*` helpers.
- `--text-align` — text alignment, set by `.text-start` / `.text-center` / `.text-end`.
