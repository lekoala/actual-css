# Scroll Snap

Horizontal rails that stay useful without JavaScript and snap in modern browsers.

> **Module** — import `actual-css/css/layout/scroll-snap` or `actual-css/css/layout`.

Use `.scroll-snap` for a niche row of items that should scroll horizontally, such as card rails, media strips, overflow tabs, or a simple touch-friendly carousel baseline. Scrolling only appears when the items are wider than the container; set `--scroll-snap-item-size` for card rails.

```html demo
<section class="stack" aria-labelledby="featured-title">
  <h2 id="featured-title">Featured articles</h2>

  <ul class="scroll-snap list-reset" style="--scroll-snap-item-size: min(85%, 18rem)">
    <li class="card">Article one</li>
    <li class="card">Article two</li>
    <li class="card">Article three</li>
    <li class="card">Article four</li>
    <li class="card">Article five</li>
  </ul>
</section>
```

The baseline is flex layout plus `overflow-x: auto`, so older browsers still get a usable horizontal scroll area. Browsers with scroll snap support add `scroll-snap-type` and item alignment.

Items snap to the inline start edge by default. Use `data-snap="center"` for visual rails where centered cards are the better fit.

```html demo
<div class="scroll-snap" data-snap="center" style="--scroll-snap-item-size: min(85%, 18rem)">
  <article class="card">One</article>
  <article class="card">Two</article>
  <article class="card">Three</article>
  <article class="card">Four</article>
  <article class="card">Five</article>
</div>
```

## CSS hooks

- `--scroll-snap-item-size` — item `flex` basis; set it for card rails.
- `--scroll-snap-gap` — space between items.
- `--scroll-snap-padding` — inline scroll padding, so a snapped item does not sit
  flush against the container edge. Not declared; falls back to `--scroll-snap-gap`.
- `--scroll-snap-align` — item snap alignment. Prefer `data-snap="center"`
  over setting this directly.

Keep scrollbars visible by default. If a product deliberately hides them, make that choice explicit with `data-scrollbar="hidden"`.

```html
<div class="scroll-snap" data-scrollbar="hidden">
  ...
</div>
```

`.scroll-snap` is not a full interactive carousel. For previous/next controls, pagination, active state, mouse drag, looping, autoplay, or robust accessibility behavior, use a dedicated carousel library such as Swiper and compose it with Actual components.
