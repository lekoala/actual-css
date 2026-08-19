# Card

Flexible content container with optional header, body, and footer regions, plus full-bleed children.

## Class reference

| Class | Kind | Description |
|---|---|---|
| `.card` | Component | Neutral raised surface for grouped content. |
| `.raised` | Variant | Elevated surface with a soft shadow. |
| `.subtle` | Variant | Lower contrast against the page surface. |
| `.inverted` | Surface modifier | Inverse surface treatment: paints `--surface-solid` and swaps the foreground to `--surface`, so it inverts in dark themes instead of always reading as dark. Apply as `class="card inverted"`, or on any block. |
| `.compact` | Variant | Tighter padding for dense contexts. |

## Basic usage

Use semantic elements inside the card. A direct `<header>` or `<footer>` is the
card's structural slot. Cards do not own page spacing — compose them with
layout primitives like `.grid`.

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

Use `.bleed` on a direct child to escape the card padding — full-width images,
colored headers, or footers.

```html demo
<div style="max-inline-size: 32rem">
  <article class="card stack">
    <img class="bleed" src="https://picsum.photos/seed/actual-css-card/600/300" alt="Coastal cliffs at dusk" />
    <header>
      <h3>Coastal cliffs at dusk</h3>
    </header>
    <section class="stack" aria-label="Summary">
      <p>A short caption that wraps across a few lines. The image bleeds to the card edges.</p>
    </section>
    <footer>
      <span class="badge primary soft">Photo</span>
      <button type="button" class="btn outline">View</button>
    </footer>
  </article>
</div>
```

```html demo
<article class="card stack" style="--card-max-inline-size: 24rem">
  <header class="bleed stack items-center text-center" style="background: var(--surface-subtle)">
    <hgroup>
      <h3>Team</h3>
      <p class="muted">For growing products</p>
    </hgroup>
    <p>
      <span style="font-size: 2rem; font-weight: var(--font-weight-strong); line-height: 1">$24</span>
      <span class="muted">/ user / month</span>
    </p>
  </header>

  <ul class="stack items-center" style="list-style: none; padding: 0">
    <li>Unlimited projects</li>
    <li>Up to 25 seats</li>
    <li>Shared workspaces</li>
    <li>Priority support</li>
  </ul>

  <footer class="bleed" style="background: var(--surface-subtle); justify-content: center">
    <a class="btn primary" href="#">Upgrade</a>
  </footer>
</article>
```

## In grids

Cards display nicely in grids with equal-height behavior.

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

`.inverted` creates a contrasting surface context, not a complete theme island.
On a bare block (`<header class="inverted">`, `<section class="inverted">`) it
paints the surface directly; contextual content and transparent treatments such
as `.btn.outline`, `.btn.ghost`, and `.btn.link` follow its foreground.

Apply it directly to a component that consumes the shared `--ui-*` surface
contract (`.card`, `.navbar`, `.alert`, `.badge`) to treat that component as the
contrasting surface. A surface-owning component nested inside an inverted block
keeps its own surface and establishes a new context for its descendants. Use a
`data-theme` island when every component and form control in a subtree must use
another theme.

More specific component states or explicit surface variants still take
precedence: `.card.inverted.subtle` keeps the `.subtle` background while the
foreground stays inverted.

`.inverted` and `.subtle` are competing surface treatments — do not combine
them. `.subtle` paints the card's background directly while `.inverted` swaps
the surface tokens, so `.card.subtle.inverted` renders a subtle background with
inverted foreground. Treat them as mutually exclusive, like two competing
variants.

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

  <article class="card inverted stack">
    <hgroup>
      <h3>Inverted</h3>
      <p>Inverse surface for emphasis. Text inherits the contrasting surface color.</p>
    </hgroup>
    <button type="button" class="btn">Action</button>
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
- `--card-pad` — inner padding; also drives the negative offsets that let a `.bleed` child reach the card edge. `.compact` lowers it.
