# Cluster

Inline groups that wrap naturally, useful for action rows, tags, and toolbars.

```html demo
<div class="cluster">
  <button class="btn primary" type="button">Save</button>
  <button class="btn outline" type="button">Cancel</button>
  <a href="#">Read docs</a>
</div>
```

Use cluster for action rows, tags, toolbar sections, metadata, and compact navigation.

## CSS hooks

- `--cluster-justify` — main-axis distribution (`justify-content`).
- `--cluster-align` — cross-axis alignment (`align-items`).
- `--cluster-wrap` — wrapping behavior (`flex-wrap`); set to `nowrap` to force a single row.
- `--gap` — space between items.

## Split / spread

For split/spread layouts — two items apart, at opposite ends, or "one left / one
right" — use `.cluster` with `--cluster-justify: space-between`. There is no
separate `.split` or `.spread` primitive; this is the same relationship.

```html demo
<div class="cluster" style="--cluster-justify: space-between">
  <h2>Results</h2>
  <button class="btn primary" type="button">New search</button>
</div>
```

To align a row to its top edge instead of centering it — useful when one item
wraps to several lines — set `--cluster-align`.

```css
.filters {
  --cluster-align: start;
  --cluster-justify: space-between;
}
```

The optional utility layer ships `.justify-content-start`, `.justify-content-center`,
`.justify-content-end` and `.justify-content-space-between`, which set
`--cluster-justify` for you. See the utilities page.