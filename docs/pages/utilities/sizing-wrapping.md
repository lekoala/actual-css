# Sizing And Wrapping

Small layout corrections for controls, labels, and compact rails.

## Class reference

| Class                     | Kind    | Description                               |
| ------------------------- | ------- | ----------------------------------------- |
| `.fit`                    | Utility | Shrinks an element to its content width.  |
| `.text-nowrap`            | Utility | Keeps text on one line.                   |
| `.truncate`               | Utility | Ellipsizes overflowing single-line text.  |
| `.scroller`               | Layout  | Theme-aware scrollbar density and colour. |
| `.scroller.stable-gutter` | Variant | Reserves inline-axis scrollbar gutter.    |

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

The utility is two standard declarations and nothing else — the engine keeps
drawing the scrollbar, `.scroller` only hands it a density and a colour that
follow the theme. There is no `::-webkit-scrollbar` chrome: rebuilding a thumb
by hand means re-implementing the hover, the corner and the light/dark
adaptation that `color-scheme` already provides, and the hand-built version
never quite matches the native one anyway.

`scrollbar-color` and `scrollbar-width` land in Chromium 121 and Safari 18.2,
above the capability floor. An engine that knows neither ignores both
declarations and draws its native scrollbar — the intended fallback, not a
broken state.

`.scroller` is a layout primitive, so it comes with `actual.full.css` and with
`actual-css/css/layout` like `.stack` or `.cluster`. A project importing module
by module reaches it directly:

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
  --scroller-track: transparent;
  --scroller-thumb: var(--border);

  scrollbar-color: var(--scroller-thumb) var(--scroller-track);
  scrollbar-width: thin;
}
```

Customize locally when a scroll surface needs more contrast:

```html
<div class="overflow-auto scroller" style="--scroller-thumb: var(--text-muted)">
  ...
</div>
```

Thickness is not a hook: `scrollbar-width` takes `thin` or `auto`, not a length.
Hover is left to the engine — it varies by platform, and matching it by hand was
the part of a custom scrollbar that never held up.

## CSS hooks

- `--scroller-track` — scrollbar track color.
- `--scroller-thumb` — scrollbar thumb color.
