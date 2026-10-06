# Sizing And Wrapping

Small layout corrections for controls, labels, and compact rails.

## Class reference

| Class                     | Kind    | Description                               |
| ------------------------- | ------- | ----------------------------------------- |
| `.fit`                    | Utility | Shrinks an element to its content width.  |
| `.text-nowrap`            | Utility | Keeps text on one line.                   |
| `.text-wrap`              | Utility | Restores wrapping under a nowrap parent.  |
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

Use `.text-nowrap` to keep text on one line inside a cell or label, and
`.text-wrap` to let a long label wrap inside a component that keeps its text on
one line (`.badge`). To stop a layout primitive from wrapping — for example to
force a `.cluster` onto a single row — set `--cluster-wrap: nowrap`.

```html demo
<div class="cluster tight" style="--cluster-wrap: nowrap;">
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

Use `.scroller` to apply optional framework overflow treatment to a scroll container: a quieter scrollbar. It does not create overflow; pair it with `.overflow-auto` or a component that already creates overflow.

The engine keeps drawing the scrollbar; `.scroller` only hands it a density
and a colour that follow the theme. There is no `::-webkit-scrollbar` chrome: rebuilding a thumb
by hand means re-implementing the hover, the corner and the light/dark
adaptation that `color-scheme` already provides, and the hand-built version
never quite matches the native one anyway.

`scrollbar-color` and `scrollbar-width` land in Chromium 121 and Safari 18.2,
above the capability floor. An engine that knows neither ignores both
declarations and draws its native scrollbar — the intended fallback, not a
broken state.

`.scroller` applies to fine pointers only. On a touch screen the native overlay
scrollbar stays: it hides at rest, where a styled bar would stay visible.

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
}

@media (pointer: fine) {
  .scroller {
    scrollbar-color: var(--scroller-thumb) var(--scroller-track);
    scrollbar-width: thin;
  }
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

### One-row strips

Components that never wrap scroll horizontally when they do not fit: `.tabs`,
`.steps-horizontal`, and `.table-wrap`. (`.breadcrumb` truncates its labels
instead; see [Breadcrumb](../components/breadcrumb.md). `.pagination` wraps.)
A strip that loads on a current link tab or step starts scrolled to it.

`.tabs` hides its scrollbar and fades its edges instead: selecting the clipped
tab scrolls it into view. The others leave the scrollbar to the engine, so an
OS-default horizontal scrollbar can sit under a short strip, and on touch
screens it overlays the strip and hides at rest, leaving a clipped item as the
cue that the strip continues. Put `.scroller` on the strip itself — the element
that scrolls — for a thin, theme-coloured bar under a mouse; touch keeps the
overlay. These strips have no edge fade (overflow shadow, scroll hint): the
clipped item and the scrollbar already say there is more. Keyboard focus stops
an item with its focus line inside the strip.

```html
<ol class="steps steps-horizontal scroller">
```

There is no class that hides the scrollbar: on a strip whose items do not
scroll it themselves, it is the only visible scroll control for a mouse without
a horizontal wheel. Apply `.scroller` to every such strip of a page, or to
none, so the bars stay consistent.

A strip keeps scrolling inside a flex or grid row, such as a label and link
tabs on one `.cluster`: a `<nav>` directly around `.tabs` shrinks with the row
(and around `.breadcrumb`, which then truncates). Any other wrapper needs
`min-inline-size: 0`, or the row pushes the whole page into scrolling.

```html
<div class="cluster">
  <span>Sections</span>
  <nav aria-label="Account sections"><ul class="tabs">…</ul></nav>
</div>
```

## CSS hooks

- `--scroller-track` — scrollbar track color.
- `--scroller-thumb` — scrollbar thumb color.
