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

Cluster owns its children's spacing: direct-child margins are reset, so spacing
between items always comes from `--gap`. Unlike `.stack`, which resets only the
block axis, cluster resets margins on both axes — a wrapping cluster's `gap`
controls inline spacing between items and block spacing between wrapped rows.

## Action rows

Actions are content; the cluster owns the geometry. A semantic action list is a
`<menu>` (or `<ul>`) with `.cluster`:

```html demo
<menu class="cluster">
  <li><button class="btn primary" type="button">Save</button></li>
  <li><button class="btn outline" type="button">Cancel</button></li>
</menu>
```

There is no `.actions` class. A dense row is `cluster compact`; a vertical action
list is `stack list-reset`.

## List chrome

`.cluster` neutralizes the native chrome of a `<ul>`, `<ol>` or `<menu>` it is
applied to. The element stays a list in the DOM and for assistive technology,
but a horizontal, wrapping group cannot carry markers and indentation
meaningfully, so they are removed. `.stack` makes no such change — an
`<ol class="stack">` keeps its numbers. Use `.list-reset` alone for a plain list
with no layout.

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

## Controls inside a wrapping cluster

A form control (`--control-size`, full width) inside a **wrapping** cluster claims
the full line and pushes every sibling to its own row. To keep a row of controls
under one label, set `--cluster-wrap: nowrap` and give the controls
`min-inline-size: 0` (and `flex: 1 1 0%` to share the row evenly).
