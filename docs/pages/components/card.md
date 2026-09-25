# Card

Flexible content container with optional header, body, and footer regions.

## Class reference

| Class      | Kind      | Description                                     |
| ---------- | --------- | ----------------------------------------------- |
| `.card`    | Component | Neutral raised surface for grouped content.     |
| `.raised`  | Variant   | Elevated surface with a soft shadow.            |
| `.subtle`  | Variant   | Lower contrast against the page surface.        |
| `.surface` | Variant   | The page surface; intent in the text only.      |
| `.compact` | Density   | Tighter padding and compact descendant context. |

`.surface` is a shared variant: it paints the page surface instead of
`--surface-raised` and leaves the intent to the text. For a dark card on a
light page (or the reverse), put `data-theme="dark"` on the card.

## Basic usage

Use semantic elements inside the card. A direct `<header>` or `<footer>` is the
card's structural slot. A direct `<footer>` is anchored to the bottom of the
card when extra block space is available, so prices and actions line up across
equal-height cards. Cards do not own page spacing — compose them with layout
primitives like `.grid`. A bare card owns the rhythm between its direct
children through `--card-gap`; applying a layout primitive such as `.stack` or
`.media` to the same element gives that primitive control of the layout and
gap.

```html demo
<div style="max-inline-size: 32rem">
  <article class="card stack">
    <header>
      <hgroup>
        <h3>Understanding Semantic HTML</h3>
        <p class="muted">A quick primer for new contributors</p>
      </hgroup>
    </header>

    <p>Using the right HTML tags improves both SEO and accessibility. Lean on landmarks and live lists.</p>

    <ul class="cluster" style="list-style: none; padding: 0; margin: 0; gap: 0.5rem" aria-label="Tags">
      <li><span class="badge primary soft secondary">HTML</span></li>
      <li><span class="badge soft primary">Accessibility</span></li>
      <li><span class="badge outline">5 min read</span></li>
    </ul>

    <footer>
      <time datetime="2026-06-12" class="muted">June 12, 2026</time>
      <button type="button" class="btn outline">Read more</button>
    </footer>
  </article>
</div>
```

## Bleed

Use `.bleed` on a direct child to bring an image or band to the card edge. See
[Bleed](bleed.md) for the shared surface contract and its modular import.

## In grids

Cards display nicely in grids with equal-height behavior. Each card in a row
stretches to the row height, and a direct `<footer>` anchors to the bottom, so
all footers in the row line up regardless of body length.

```html demo
<section class="grid">
  <article class="card">
    <header>
      <h3>Components</h3>
    </header>
    <p>Buttons, alerts, dialogs — all opt-in.</p>
    <footer>
      <a class="btn outline" href="#">Browse</a>
    </footer>
  </article>

  <article class="card">
    <header>
      <h3>Layout</h3>
    </header>
    <p>Stack, cluster, grid, switcher, sidebar.</p>
    <footer>
      <a class="btn outline" href="#">Browse</a>
    </footer>
  </article>

  <article class="card">
    <header>
      <h3>Patterns</h3>
    </header>
    <p>Actions, nav-list — small structural helpers.</p>
    <footer>
      <a class="btn outline" href="#">Browse</a>
    </footer>
  </article>
</section>
```

## Surfaces

A card is a surface-owning component: inside a painted band it keeps its own
surface and resets the context for its content. A card with
`data-theme="dark"` is a complete dark island — its fields, intents and states
all follow.

`.surface` is the shared variant on a card: it drops the card to the page
surface instead of `--surface-raised`, keeps the theme border, and lets an
intent class color the text only. `.raised` and `.subtle` are the card-local
treatments on either side of it.

```html demo
<section class="grid">
  <article class="card raised">
    <hgroup>
      <h3>Raised</h3>
      <p class="muted">Elevated surface with a soft shadow.</p>
    </hgroup>
  </article>

  <article class="card subtle">
    <hgroup>
      <h3>Subtle</h3>
      <p class="muted">Lower contrast against the page surface.</p>
    </hgroup>
  </article>

  <article class="card surface">
    <hgroup>
      <h3>Surface</h3>
      <p class="muted">The page surface with the theme border.</p>
    </hgroup>
  </article>

  <article class="card stack" data-theme="dark">
    <hgroup>
      <h3>Dark island</h3>
      <p class="muted">A complete dark theme on one card.</p>
    </hgroup>
    <button type="button" class="btn primary outline">Action</button>
  </article>

  <article class="card compact">
    <hgroup>
      <h3>Compact</h3>
      <p class="muted">Tighter padding for dense contexts.</p>
    </hgroup>
  </article>
</section>
```

## CSS hooks

- `--card-radius` — corner radius.
- `--card-max-inline-size` — maximum width.
- `--card-pad` — inner padding, relayed to direct children for `.bleed`. `.compact` lowers it.
- `--card-gap` — space between direct children of a bare card. A composed layout primitive owns its own gap instead.
