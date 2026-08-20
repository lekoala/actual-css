# Sizing And Wrapping

Small layout corrections for controls, labels, and compact rails.

## Class reference

| Class | Kind | Description |
|---|---|---|
| `.fit` | Utility | Shrinks a control or element to its content width. |
| `.text-nowrap` | Utility | Keeps text on one line. |
| `.truncate` | Utility | Ellipsizes overflowing single-line text. |
| `.scroller` | Utility | Quiet custom scrollbar chrome for scroll containers. Optional layer. |
| `.scroller.stable-gutter` | Variant | Reserves scrollbar gutter space so layout does not shift. Optional layer. |

Use `.fit` when a control or element should shrink to its content instead of filling the available inline space.

```html demo
<select class="select fit" aria-label="Theme">
  <option>System</option>
  <option>Light</option>
  <option>Dark</option>
</select>
```

Use `.text-nowrap` to keep text on one line inside a cell or label. To stop a
layout primitive from wrapping — for example to force a `.cluster` onto a single
row — set `--cluster-wrap: nowrap`.

```html demo
<div class="cluster sm" style="--cluster-wrap: nowrap;">
  <select class="select sm fit" aria-label="Segment">
    <option>All segments</option>
  </select>
  <button class="btn sm outline" type="button">Filter</button>
</div>
```

Use `.truncate` on the flexible item that should ellipsize inside a constrained row.

```html demo
<header class="cluster" style="--cluster-wrap: nowrap;">
  <strong class="truncate">A long account name that should not push actions away</strong>
  <button class="btn sm ghost" type="button">Open</button>
</header>
```

```css
.fit {
  inline-size: fit-content;
  max-inline-size: 100%;
}

.text-nowrap {
  white-space: nowrap;
}

.truncate {
  min-inline-size: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

## Scroller

Use `.scroller` to apply optional framework scrollbar treatment to a scroll container. It styles the scrollbar only; pair it with `.overflow-auto` or a component that already creates overflow.

`scroller` is not imported by `actual.css`. Import it explicitly when a project wants Actual CSS scrollbar chrome instead of the native OS default:

```css
@import "actual-css/css/layout/scroller";
```

```html demo
<div class="overflow-auto scroller" style="max-block-size: 12rem">
  <div class="stack">
    <p>Scrollable content keeps the native scrollbar but makes it quieter.</p>
    <p>Long content can keep flowing without forcing every component to invent its own scrollbar rules.</p>
    <p>The utility exposes local custom properties for one-off tuning.</p>
  </div>
</div>
```

```css
.scroller {
  --scroller-size: 0.625rem;
  --scroller-padding: 0.125rem;
  --scroller-track: transparent;
  --scroller-thumb: var(--border);
  --scroller-thumb-hover: var(--text-muted);

  scrollbar-color: var(--scroller-thumb) var(--scroller-track);
  scrollbar-width: thin;
}
```

Customize locally when a scroll surface needs more contrast:

```html
<div class="overflow-auto scroller"
     style="--scroller-thumb: var(--text-muted); --scroller-thumb-hover: var(--text)">
  ...
</div>
```

For rounded scroll containers, keep the thumb visually away from the edge by tuning `--scroller-padding` rather than adding extra wrappers or masking pseudo-elements.

## CSS hooks

- `--scroller-size` — scrollbar thickness.
- `--scroller-padding` — inset between the thumb and the track edge.
- `--scroller-track` — scrollbar track color.
- `--scroller-thumb` — scrollbar thumb color.
- `--scroller-thumb-hover` — scrollbar thumb color on hover.