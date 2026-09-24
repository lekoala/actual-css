# Bleed

`.bleed` lets a direct child of a padded surface reach its edges. Use it for a
full-width image, a colored header or footer, or a notice band.

It works inside `.card`, `.drawer`, and an accordion panel. The accordion panel
owns the padding, so place `.bleed` directly inside the panel, after the summary.
A deeper descendant stays within its wrapper. A modular build imports
`actual-css/css/components/bleed` alongside the surface component.

```html demo
<article class="card stack" style="--card-max-inline-size: 24rem">
  <img class="bleed" src="https://picsum.photos/seed/actual-css-card/600/300" alt="" />
  <header><h3>Full-width image</h3></header>
  <p>The image reaches the card edges.</p>
  <footer class="bleed" style="background: var(--surface-subtle)">
    <button type="button" class="btn outline">View</button>
  </footer>
</article>
```

An `<img>`, `<picture>`, `<video>`, `<canvas>`, or `<svg>` with `.bleed` expands
to the surface width. For a responsive image, put `.bleed` on `<picture>`; its
image fills the picture and is clipped by it.

Structural `header`, `footer`, and `figure` bands keep the surface's inner
padding while their background reaches the edge. Other bands can read the
relayed inset with `--bleed-pad`:

```css
.status-row {
  padding: var(--bleed-pad);
}
```

The participating surface relays its inset to direct children only. Read
`--bleed-pad` on one of those children when a custom band needs matching
padding. An author-defined surface needs its own direct-child relay to join
this contract.

See [Card](card.md), [Drawer](drawer.md), and [Accordion](accordion.md) for
surface examples.
