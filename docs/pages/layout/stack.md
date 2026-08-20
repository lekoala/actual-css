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