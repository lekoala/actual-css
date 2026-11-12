# Reveal

Reveal fades a block into place the first time it enters the viewport, and never hides content that is already visible.

> **Module** — import `actual-css/css/effects/reveal` and `actual-css/js/in-view`, or the `actual-css/css/effects` and `actual-css/js/full` bundles.

```html demo
<section class="card stack reveal" data-enhance="in-view">
  <h2>Built for actual interfaces</h2>
  <p class="muted">This block fades in once, the first time it scrolls into view.</p>
</section>
```

**Related terms:** scroll reveal, fade in on scroll, entrance animation, lazy appearance, on-scroll animation.

Reveal is one effect and one trigger. `data-enhance="in-view"` observes the element; while it waits outside the viewport the runtime adds `is-pending`, and each effect's CSS decides what that state looks like. The runtime itself knows no animation.

The safety rule comes first: an element that is already visible when the runtime starts is never hidden and never animates. Only an element the observer reports off screen is masked, before the next paint. Without JavaScript, under reduced motion, or in print, nothing is hidden at all.

## Usage

- Load the runtime with `actual-css/js/full`, or register only `actual-css/js/in-view`.
- Add `data-enhance="in-view"` next to the effect class; the class alone never hides anything.
- Put the effect on the content box rather than a section with generous leading padding: the observer triggers when the box enters, including its padding.
- Set `data-in-view-margin="0px 0px -64px 0px"` to start after the box has entered farther into the viewport. The value uses `IntersectionObserver.rootMargin` syntax; it affects the entrance, while initially visible content stays visible.
- Reveal an element once, not on every pass: the runtime stops observing after the first appearance.
- The element keeps its text, tab order, and accessible name while pending. Effects hide it with opacity only, so Tab, an in-page anchor, and find-in-page can still reach it; focus releases the state immediately.
- Do not put `.reveal` on the hero or another block that is always in the first screen. Use it below the fold, where the entrance can actually be seen.
- Respect the user's motion preference by leaving the decision to CSS. A reduced-motion visitor sees the content at rest.

## Staggered groups

Put `.reveal-group` on the container instead of `.reveal`. The direct children appear one after another. The delay comes from `sibling-index()`, capped at eight steps so a long list settles instead of cascading forever.

```html demo
<ul class="cluster reveal-group" data-enhance="in-view">
  <li class="card">First</li>
  <li class="card">Second</li>
  <li class="card">Third</li>
</ul>
```

An engine without `sibling-index()` drops the delay declaration and reveals the whole group at once. That is the intended degradation, not a fallback to author.

The group itself is the observed element; its children carry the motion and need no token of their own.

### Hooks

- `--reveal-duration` — entrance duration for one element or one group child.
- `--reveal-distance` — vertical offset the content travels while appearing.
- `--reveal-stagger` — delay between two consecutive children of `.reveal-group`; it also scales the cap, which stays at eight steps.
