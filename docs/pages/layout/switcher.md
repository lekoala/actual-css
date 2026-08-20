# Switcher

Use `.switcher` for a small set of peer regions that should switch together
between one row and a vertical stack. Unlike `.grid`, it never produces a
partial row such as two items followed by one orphan.

```html demo
<section class="switcher">
  <article class="card"><h3>Profile</h3><p>Personal details.</p></article>
  <article class="card"><h3>Security</h3><p>Login settings.</p></article>
  <article class="card"><h3>Billing</h3><p>Payment details.</p></article>
</section>
```

Use `.grid` instead for repeatable collections whose items can reflow
independently.

### Hooks

- `--switcher-threshold` controls the space needed before all peers share a row.
