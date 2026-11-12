# Reveal

Reveal fades a block into place on its first render, or the first time it scrolls into view with the in-view runtime.

> **Module** — import `actual-css/css/effects/reveal`, plus `actual-css/js/in-view` for the scroll trigger, or the `actual-css/css/effects` and `actual-css/js/full` bundles.

```html demo
<section class="card stack reveal" data-enhance="in-view">
  <h2>Built for actual interfaces</h2>
  <p class="muted">This block fades in once, the first time it scrolls into view.</p>
</section>
```

**Related terms:** scroll reveal, fade in on scroll, entrance animation, animate on load, hero intro, lazy appearance, on-scroll animation.

`.reveal` alone plays its entrance once, when the element is first rendered, with no JavaScript. That suits a hero or an introduction. `data-enhance="in-view"` adds the scroll trigger: an element the observer reports off screen is held hidden with `is-pending` and plays the same entrance when it first enters. An element already visible when the runtime starts keeps its first-render entrance and is never hidden.

Without the runtime, everything plays on load and ends visible. Under reduced motion or in print nothing moves and nothing is hidden.

## Usage

- Use `.reveal` alone for content in the first screen; add `data-enhance="in-view"` for content below the fold.
- Load the runtime with `actual-css/js/full`, or register only `actual-css/js/in-view`.
- Do not combine `.reveal` with another animated class on the same element, such as `.shimmer` or `.spinner`: one `animation` replaces the other. Nest one inside the other instead. Transitions are unaffected, so `.reveal` can sit on a `.btn` or a card.
- The entrance replays whenever the element is rendered again after `display: none`, for example inside a tab panel or a `[hidden]` toggle. Keep Reveal outside content that toggles if the replay is unwanted.
- Put the effect on the content box rather than a section with generous leading padding: the observer triggers when the box enters, including its padding.
- Set `data-in-view-margin="0px 0px -64px 0px"` to start after the box has entered farther into the viewport. The value uses `IntersectionObserver.rootMargin` syntax; it affects the entrance, while initially visible content stays visible.
- The element keeps its text, tab order, and accessible name while pending. Effects hide it with opacity only, so Tab, an in-page anchor, and find-in-page can still reach it. Focus shows it at once, without an entrance.

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
