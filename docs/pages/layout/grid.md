# Grid

Two contracts sit behind these classes. Pick by asking what determines the
column count.

- The **item width** is what matters — use `.grid` and tune `--grid-min`.
- The **column density** is what matters — use `.grid-2`, `.grid-3`, `.grid-4`,
  or `.grid-6`.

## Space-driven collection

`.grid` fits as many columns as the available inline space permits. Incomplete
final rows are part of the contract.

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

## Count-driven density

`.grid-N` declares a structural density of N columns. It is responsive on its
own: it never exceeds N columns, never overflows, and every item keeps the same
width.

```html demo
<div class="grid-4">
  <div class="card">Exercitation</div>
  <div class="card">Amet mollit</div>
  <div class="card">Aute cillum</div>
  <div class="card">Duis non </div>
</div>
```

`--grid-min` does not apply here. Item width is `.grid`'s contract; column
density is `.grid-N`'s. Choose the preset that suits your item size:

| Item                              | Preset               |
|-----------------------------------|----------------------|
| large card                        | `.grid-2`            |
| card with a heading and a summary | `.grid-3`, `.grid-4` |
| compact tile, stat, avatar        | `.grid-6`            |

## Balanced subdivision

Left alone, a preset collapses one column at a time, so a six-item `.grid-6`
can pass through five columns — five items and a lone sixth. The example above
is that bare version. Placed inside a container named **`actual-container`** — the
`.container-query` helper, or a region of your own that declares
`container: actual-container / inline-size` — it only ever enters a **divisor of N**:

```text
.grid-2   2 → 1
.grid-3   3 → 1
.grid-4   4 → 2 → 1
.grid-6   6 → 3 → 2 → 1
```

Every state splits the collection evenly, and all items keep the same width.

```html demo
<div class="container-query">
  <div class="grid-6">
    <div class="card">1</div>
    <div class="card">2</div>
    <div class="card">3</div>
    <div class="card">4</div>
    <div class="card">5</div>
    <div class="card">6</div>
  </div>
</div>
```

### Container sizes

The steps are read from the **container's content box** — not the viewport, and
not the grid's own width. Padding and borders on the container come off before
the query resolves.

| Container content box | `.grid-2` | `.grid-3` | `.grid-4` | `.grid-6` |
|-----------------------|-----------|-----------|-----------|-----------|
| under `28rem`         | 1         | 1         | 1         | 1         |
| `28rem` to `48rem`    | 2         | 1         | 2         | 2         |
| `48rem` to `64rem`    | 2         | 3         | 2         | 3         |
| `64rem` and up        | 2         | 3         | 4         | 6         |

Size a region that hosts a `.grid-N` so it lands on the step you want, with room
to spare. The step is a cliff, not a ramp: a container at `47rem` gives
`.grid-3` a single column, the same as one at `20rem`. `.grid-3` has no
intermediate state by design — it never shows `2 + 1`.

Budget backwards from the content box. A region that must reach a step needs
that width **plus its own padding and borders**:

```text
3 columns   48rem + 2 x 1rem padding  ~= 50rem outer
4 or 6      64rem + 2 x 1rem padding  ~= 66rem outer
```

Round up past the figure rather than matching it exactly, so a later padding
change cannot drop the region a state.

Balanced subdivision is precision, never a prerequisite for responsive
behavior — forgetting the container costs you the exact chain, nothing else.
`actual-container` is the framework's shared name for size-aware components,
so one region can serve a grid and a step flow at once. The grid responds only
to that name, never to an incidental query container, so a region that sets
`container-type: inline-size` for its own reasons leaves the grid untouched. The container has to be an
ancestor: an element cannot query its own size without taking inline-size
containment, which would collapse the grid inside a `.cluster`, a float, or any
shrink-to-fit box. Put it on a normal block-level wrapper for the same reason.

The chain balances the **declared density**, not your actual item count. Eight
items in `.grid-6` still give `6 + 2`. For a paginated collection, choose a page
size that suits the density — 12, 20, and 24 divide well. A partial final page
is normal.

## Exact templates

`--grid-columns` replaces `.grid`'s intrinsic recipe. Use it for exact track
templates that do not match a built-in layout contract: arbitrary structural
counts such as seven calendar days, asymmetric fractional tracks, or mixed
intrinsic/flexible tracks. Once set, the application owns narrow-container
behavior.

```css
/* Semantic count not represented by .grid-N */
--grid-columns: repeat(7, minmax(0, 1fr));

/* Meaningful asymmetric ratio */
--grid-columns: 2fr 1fr 1fr 1fr;

/* Intrinsic trailing control */
--grid-columns: repeat(4, minmax(0, 1fr)) auto;
```

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

For an ordinary main region plus an aside, prefer `.sidebar-layout`. When a
small group of peer regions must be either entirely horizontal or entirely
stacked, prefer `.switcher`.

### Hooks

- `--grid-min` tunes the minimum item width of the intrinsic `.grid` recipe.
  It does not apply to `.grid-N`.
- `--grid-columns` replaces that recipe with an author-owned template.
