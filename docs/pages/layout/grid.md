# Grid

Use `.grid` for responsive collections of equivalent items. It fits as many
columns as the available inline space permits; incomplete final rows are part
of the contract.

```html demo
<section class="grid">
  <article class="card"><h3>Starter</h3><p>For small projects.</p></article>
  <article class="card"><h3>Team</h3><p>For shared products.</p></article>
  <article class="card"><h3>Scale</h3><p>For larger systems.</p></article>
</section>
```

Tune the item minimum with `--grid-min`.

```css
.pricing-grid {
  --grid-min: 20rem;
}
```

## Fixed structural grids

Use `.grid-2`, `.grid-3`, `.grid-4`, or `.grid-6` only when the exact number
of columns is part of the composition. These presets never collapse, including
inside `.container-query`. That stable meaning is useful for comparison rows,
fixed matrices, and other structures where an empty cell must remain empty.

```html demo
<div class="grid-3">
  <div class="card">Name</div>
  <div class="card">Plan</div>
  <div class="card">Status</div>
</div>
```

Do not use a fixed preset for a responsive collection of cards, stats, tiles,
or swatches. Use `.grid` and tune `--grid-min` instead. Use `.switcher` when a
small group of peer regions must be either entirely horizontal or entirely
stacked.

## Exact templates

`--grid-columns` replaces `.grid`'s intrinsic recipe. This is an escape hatch
for exact or asymmetric templates; once set, the author owns their responsive
behavior.

```html
<div class="container-query">
  <div class="editorial-grid grid">...</div>
</div>
```

```css
.editorial-grid {
  --grid-columns: minmax(0, 2fr) minmax(0, 1fr);
}

@container (width < 40rem) {
  .editorial-grid {
    --grid-columns: 1fr;
  }
}
```

For an ordinary main region plus an aside, prefer `.sidebar-layout`.

### Hooks

- `--grid-min` tunes the minimum item width of the intrinsic `.grid` recipe.
- `--grid-columns` replaces that recipe with an author-owned template.
