# Indicator

> Attach any component to one of a container's four corners.

`.indicator` creates the positioning context and `.indicator-item` positions
its child at the top-end corner. The primitive does not add a background,
size, border, or contrast ring: compose it with `.badge` or another component
that owns its appearance.

## Class reference

| Class             | Kind      | Description                                      |
|-------------------|-----------|--------------------------------------------------|
| `.indicator`      | Component | Positioning context for an overlaid child.       |
| `.indicator-item` | Part      | Item attached to the top-end corner by default.  |
| `.start`          | Placement | Moves the item to the inline-start corner.       |
| `.bottom`         | Placement | Moves the item to the bottom corner.             |

Combine `.bottom.start` for bottom-start. Logical inline placement follows the
document direction automatically.

```html demo
<div class="cluster" style="padding: var(--space-40);">
  <button class="btn indicator" type="button">
    Inbox
    <span class="indicator-item badge danger solid">3</span>
  </button>

  <article class="card indicator" style="max-inline-size: 18rem;">
    <span class="indicator-item start badge success">New</span>
    <h2>Quarterly report</h2>
    <p>The latest figures are ready to review.</p>
  </article>
</div>
```

## Four corners

```html demo
<div class="indicator card" style="inline-size: 12rem; min-block-size: 7rem; margin: var(--space-40);">
  <span class="indicator-item badge solid" aria-label="Top end">TE</span>
  <span class="indicator-item start badge solid" aria-label="Top start">TS</span>
  <span class="indicator-item bottom badge solid" aria-label="Bottom end">BE</span>
  <span class="indicator-item bottom start badge solid" aria-label="Bottom start">BS</span>
  <p class="muted">Four logical corners</p>
</div>
```

The item extends beyond the container edge. An ancestor with clipped overflow
can cut it off; leave overflow visible or provide enough inset space in that
composition. Avatar status dots keep their dedicated circle-aware placement
and contrast ring; continue to use `.avatar > .badge:empty` for that pattern.
