# In view

In view triggers an appearance effect once when content enters the viewport, for scroll reveals and highlights.

> **Module** — import `actual-css/js/in-view`, or the `actual-css/js/full` bundle, plus the CSS for the chosen effect.

```html demo
<section class="card stack reveal" data-enhance="in-view">
  <h2>Make an entrance</h2>
  <p>Scroll to this card to reveal it once.</p>
</section>
<p>Keep the <mark class="mark-sweep" data-enhance="in-view">important phrase</mark> in view.</p>
```

## Usage

- Put `data-enhance="in-view"` on the element whose box should trigger the effect.
- Pair it with [Reveal](../components/reveal.md) for a block or staggered group, or [Mark sweep](../components/mark-sweep.md) for a highlighted phrase.
- Load the matching effect CSS: `actual-css/css/effects/reveal`, `actual-css/css/effects/mark-sweep`, or the `actual-css/css/effects` bundle.
- Leave `is-pending` to the runtime; do not add it to the markup.

The runtime adds `is-pending` only when its first observation reports the
element outside the viewport. It removes the class on first entry and stops
observing that element. Scrolling away and back does not replay the trigger.
CSS owns the appearance of the pending state and the entrance effect.

Content already visible when the runtime starts is never made pending.
Reveal keeps its CSS first-render entrance; Mark sweep keeps its full highlight.
For a staggered reveal, put `.reveal-group` and the token on the container;
the children need no token of their own.

## Trigger margin

Set `data-in-view-margin` to adjust when pending content enters. The value uses
`IntersectionObserver.rootMargin` syntax: one to four lengths in `px` or `%`.
A negative bottom margin delays the trigger until the box has moved farther
into the viewport; a positive one starts it before the box reaches the bottom.
The margin affects the entrance trigger, while initially visible content stays
visible.

```html
<section class="reveal" data-enhance="in-view" data-in-view-margin="0px 0px -64px 0px">
  <h2>A later entrance</h2>
</section>
```

The observed box includes its padding. Put the effect on the content box when
a surrounding section has generous leading padding.

## Accessibility and fallback

Pending content remains in the accessibility tree and tab order. When focus
enters it, the runtime releases it immediately and finishes the entrance so
the focused control is visible without waiting for motion.

Without JavaScript or `IntersectionObserver`, nothing becomes pending:
Reveal plays on first render and Mark sweep shows its full highlight.
Both effects remain visible without motion under reduced motion and in print.
