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