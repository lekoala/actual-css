# Grid

Responsive equal-width item grids with a tunable minimum item width.

```html demo
<section class="grid">
  <article class="card">
    <h3>Starter</h3>
    <p>For small projects.</p>
  </article>
  <article class="card">
    <h3>Team</h3>
    <p>For shared products.</p>
  </article>
  <article class="card">
    <h3>Scale</h3>
    <p>For larger systems.</p>
  </article>
</section>
```

Tune the minimum item width with `--grid-min`.

```css
.pricing-grid {
  --grid-min: 20rem;
}
```

Or replace the responsive template entirely with `--grid-columns` for a
custom or asymmetric layout. Because this overrides the intrinsic
`auto-fit/minmax` algorithm, you own any narrow-container collapse:

```css
.feature-grid {
  --grid-columns: minmax(0, 2fr) minmax(0, 1fr);
}

@container (width < 40rem) {
  .feature-grid {
    --grid-columns: 1fr;
  }
}
```

`--grid-columns` applies to `.grid` only. The `.grid-2`, `.grid-3`,
`.grid-4`, and `.grid-6` presets retain their fixed-column contracts.

## Fixed columns

Predictable 2/3/4/6-column grids. Full count by default; wrap in `.container-query` to make the column count collapse on narrow wrappers.

Use `.grid-2`, `.grid-3`, `.grid-4`, and `.grid-6` when the column count matters more than the item minimum width — for example, when a row should always read as "three items side by side", or when an empty cell should not stretch to fill space. Unlike `.grid`, the columns are fixed; if you have only two items in a `.grid-3`, the third cell stays empty rather than redistributing.

A `.grid-2/3/4/6` without a wrapper is a **fixed grid** (always at its full column count); with a `.container-query` wrapper, it's a **responsive grid** (the column count collapses on narrow wrappers). The wrapper is the query container; the grid itself is a plain block grid.

```html demo
<div class="container-query">
  <div class="grid-3">
    <article class="card">
      <h3>Starter</h3>
      <p>For small projects.</p>
    </article>
    <article class="card">
      <h3>Team</h3>
      <p>For shared products.</p>
    </article>
    <article class="card">
      <h3>Scale</h3>
      <p>For larger systems.</p>
    </article>
  </div>
</div>
```

A `grid-4` demo:

```html demo
<div class="container-query">
  <div class="grid-4">
    <article class="card">
      <h3>Starter</h3>
      <p>For small projects.</p>
    </article>
    <article class="card">
      <h3>Team</h3>
      <p>For shared products.</p>
    </article>
    <article class="card">
      <h3>Scale</h3>
      <p>For larger systems.</p>
    </article>
    <article class="card">
      <h3>Enterprise</h3>
      <p>Contact us.</p>
    </article>
  </div>
</div>
```

A `grid-6` demo for compact items:

```html demo
<div class="container-query">
  <div class="grid-6">
    <article class="card compact">
      <span class="muted">Open</span>
      <strong>18</strong>
    </article>
    <article class="card compact">
      <span class="muted">Queued</span>
      <strong>7</strong>
    </article>
    <article class="card compact">
      <span class="muted">Blocked</span>
      <strong>2</strong>
    </article>
    <article class="card compact">
      <span class="muted">Shipped</span>
      <strong>41</strong>
    </article>
    <article class="card compact">
      <span class="muted">Owners</span>
      <strong>6</strong>
    </article>
    <article class="card compact">
      <span class="muted">SLA</span>
      <strong>99%</strong>
    </article>
  </div>
</div>
```

## Behavior

- Without `.container-query`: `.grid-2` is always 2 cols, `.grid-3` is always 3 cols, `.grid-4` is always 4 cols, and `.grid-6` is always 6 cols.
- With `.container-query`: `.grid-2`, `.grid-3`, and `.grid-4` collapse to one column on a narrow wrapper (under 28rem). `.grid-3` and `.grid-4` step through 2 columns between 28rem and 48rem. `.grid-6` starts at 2 columns under 28rem, steps through 3 columns between 28rem and 64rem, then returns to 6 columns.
- The intermediate 2-col step is useful for lists of items divisible by both 2 and 3 (or 4) — a 12-item list reads as 12 lines, then 6 lines of 2, then 4 lines of 3 (or 3 lines of 4), depending on the grid.
- `.grid-6` is for compact items such as stats, shortcut tiles, swatches, avatar summaries, and small settings cards. It does not collapse to one column by default. If item width matters more than an exact six-column rhythm, prefer `.grid` with a smaller `--grid-min`.
- The wrapper is the query container, so the same class behaves differently in a narrow sidebar than in a wide main area. No viewport breakpoints are involved.

Do not add `.row`, `.col-6`, `.offset-2`, or other fixed grid-system classes unless the project later proves it needs a formal grid system.