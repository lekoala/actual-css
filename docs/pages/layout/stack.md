# Stack

Vertical flow with consistent spacing, ideal for forms, card content, and content blocks.

```html demo
<section class="stack">
  <h2>Account</h2>
  <p class="muted">Manage profile and billing settings.</p>
  <form>
    <label class="field">
      <span class="field-label">Email</span>
      <input class="input" type="email" placeholder="you@example.com" />
    </label>
  </form>
</section>
```

Use stack for forms, card content, modal bodies, side panels, and documentation blocks.

Like `.cluster`, stack owns its children's block-axis spacing: direct-child
block margins are reset, so vertical rhythm always comes from `--gap`. Inline
margins stay free — for example `margin-inline: auto` on a child centers it
without fighting the primitive.

## Don't wrap full-width regions with `.stack`

`.stack` is a column flex container, so a `.center` child — which sets its own
`inline-size` and `margin-inline: auto` — becomes a flex item that will not
stretch across the full row; it sizes to its content measure and centers inside
the flex line. For page-level full-width regions that each constrain their own
content, keep them in normal block flow instead:

```html
<header class="center">…</header>
<main class="center">…</main>
<footer class="center">…</footer>
```

Use `.stack` for the vertical rhythm *between* related items inside one region,
not as the wrapper that lays out independent full-width regions of a page.

## Choosing a density

`--gap` is the primitive's channel, and the density variants set it at the point
of use. Pick the one that matches how tightly the children belong together:

| Markup            | Gap  | Use for                                    |
| ----------------- | ---- | ------------------------------------------ |
| `.stack gap-none` | 0    | Lines forming one typographic unit         |
| `.stack sm`       | 8px  | A homogeneous series of controls           |
| `.stack`          | 12px | Normal flow between distinct elements      |
| `.stack lg`       | 24px | Sections, or blocks that read as separated |

One typographic unit means a name and a job title, or a figure and its caption.
A homogeneous series means a radio list, a checkbox list, or a compact vertical
menu.

The distinction between the first two matters. `42` above `Open issues` is
almost a single block of text, so it takes `gap-none`. Three `.choice` labels
stay three separate controls that happen to form one group, so they take `sm` —
tighter than the default, but still spaced.

A stack that mixes kinds keeps the default: five `.field` wrappers and one lone
`.choice` is a form that contains a checkbox, not a list of options, and
tightening it would squeeze the fields.

## Region rhythm goes on `gap`, not on `--gap`

A container that composes other primitives owns its rhythm through the `gap`
property. Setting `--gap` on it instead re-spaces everything it contains, at any
depth:

```css
/* Leaks: --gap is inherited, so every nested stack, cluster and grid — down to
   a radio list inside a field-group — is pushed to 24px too. */
.app-region {
  --gap: var(--space-50);
}

/* Owns its own rhythm and nothing else. Nested primitives keep --gap. */
.app-region {
  gap: var(--space-50);
}
```

Both give the region the same spacing; only the second stops there. This is what
makes a nested `.stack sm` a real density choice — 12px down to 8px — rather
than a patch cancelling a rhythm inherited from three levels up.

Setting `--gap` is still the right move on the element that *consumes* it: a
one-off `--gap` on a card body or an actions row tunes that primitive and
nothing below it, because the setter is the consumer. The leak only appears when
a container sets the token and its children read it.

`.sm` and `.lg` are the deliberate exception: they set `--gap` precisely so a
density context reaches nested layouts.

## Grouping items tightly

Stack spacing is a `--gap` between every direct child; the primitive cannot
tighten two specific children by itself. To group a few items into one unit
(a title and its description), nest a `.stack gap-none`:

```html demo
<div class="stack">
  <div class="stack gap-none">
    <strong>Ada Meridian</strong>
    <span class="muted">Senior designer working on design systems.</span>
  </div>
  <span class="badge success soft">Active</span>
</div>
```

The outer stack keeps its rhythm between groups; the inner `gap-none` unit owns
the tight pairing.

For a one-off adjacency — pull a single child closer to its neighbour without
adding a wrapper — the escape hatch is app CSS. `gap` and `margin-block` are
additive, so a negative block margin on the child cancels the following gap:

```css
.stack > .profile-row {
  margin-block-end: calc(var(--gap) * -1);
}
```

The stack resets child block margins to zero, so this re-adds a margin on that
one child only; the rest of the stack keeps its rhythm.
