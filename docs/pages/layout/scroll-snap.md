# Scroll snap

Horizontal rails that stay useful without JavaScript and snap in modern browsers.

> **Module** — import `actual-css/css/layout/scroll-snap` or `actual-css/css/layout`.

Use `.scroll-snap` for a niche row of items that should scroll horizontally, such as card rails, media strips, overflow tabs, or a simple touch-friendly carousel baseline. Scrolling only appears when the items are wider than the container; set `--scroll-snap-item-size` for card rails.

**Related terms:** carousel, card carousel, horizontal scroller, media rail, scrolling rail, grid to slider, swipe on mobile, pagination dots.

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

Items snap to the inline start edge by default, with `proximity` snapping so a short rail never fights the pointer. Use `data-snap-align="center"` for visual rails where centered cards are the better fit, and `data-snap="mandatory"` only when every stop must land.

```html demo
<div class="scroll-snap" data-snap-align="center" style="--scroll-snap-item-size: min(85%, 18rem)">
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
- `--scroll-snap-padding` — preferred inline scroll inset; defaults to
  `--scroll-snap-gap`. Use a length (`0px` for zero); conforming values stay at
  least large enough for the focus gutter, and the rail's edge items keep that
  gutter even at rest.
- `--scroll-snap-align` — item snap alignment. Prefer `data-snap-align="center"`
  over setting this directly.

Keep scrollbars visible by default. If a product deliberately hides them, make that choice explicit with `data-scrollbar="hidden"`.

```html
<div class="scroll-snap" data-scrollbar="hidden">
  ...
</div>
```

## Grid on wide, rail on narrow

To show one list as a grid in a wide container and as a swipeable rail in a narrow one, keep a single `.scroll-snap` list and turn it into a grid from an `actual-container` query:

```html
<div class="container-query">
  <ul class="scroll-snap list-reset card-rail">
    <li class="card">…</li>
  </ul>
</div>
```

```css
.card-rail {
  --scroll-snap-item-size: min(80%, 18rem);
}

@container actual-container (min-width: 48rem) {
  .card-rail {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    overflow: visible;
    margin-block: 0;
    padding: 0;
  }
}
```

Keep the item size under `100%` so the next card peeks in: iOS hides the scrollbar at rest, so the cut-off card is the scroll cue. In the grid, `overflow: visible` ends the scroll container, and resetting `margin-block` and `padding` removes the focus reserve that only a clipping rail needs.

### Pagination dots

CSS scroll markers add one dot per item in Chromium. Other browsers drop these declarations and keep the peek.

```css
.card-rail {
  scroll-marker-group: after;
}

.card-rail > li::scroll-marker {
  content: "" / attr(data-marker-label);
  inline-size: 0.5rem;
  block-size: 0.5rem;
  border-radius: var(--radius-full);
  background: var(--text-subtle);
}

.card-rail > li::scroll-marker:target-current {
  inline-size: 1.5rem;
  background: var(--primary);
}

@supports (scroll-marker-group: after) {
  .card-rail {
    scrollbar-width: none;
  }
}
```

- Each dot is a link: give every item a `data-marker-label`, because `content: ""` alone leaves the links nameless.
- The dots are controls and need 3:1 against the page: `--text-subtle` is the quietest text tone that holds it, `--border` does not. Mark the current dot by size, not color alone.
- The dots replace the scrollbar, so hide it only where they exist; `data-scrollbar="hidden"` would also hide it in browsers without markers.
- Each dot is a tab stop, placed before the items in Chromium's tab order.
- The grid needs no `scroll-marker-group` reset: markers exist only on a scroll container.

The [card rail template](../../demo/templates/card-rail.html) has the full recipe, focus ring and forced colors included.

## Carousel controls

CSS scroll buttons and markers add previous/next arrows and dots to a snapped rail without JavaScript. The [carousel template](../../demo/templates/carousel.html) has the full recipe.

```css
.carousel-track {
  scroll-marker-group: after;
}

.carousel-track::scroll-button(left) {
  content: "‹" / "Previous slide";
}

.carousel-track::scroll-button(right) {
  content: "›" / "Next slide";
}

.carousel-track::scroll-button(*):disabled {
  opacity: 0;
  visibility: hidden;
}
```

- `::scroll-button()` scrolls one page and disables itself at the end of the rail, so `:disabled` is the edge state.
- `::scroll-marker` dots need a `data-marker-label` on each item for their accessible name, as in the pagination recipe above.
- These are progressive enhancements: without them the rail keeps its native scrollbar and swipe. Use a dedicated carousel library such as [Swiper](https://swiperjs.com/) for mouse drag, looping, autoplay, or the same controls in every browser.
