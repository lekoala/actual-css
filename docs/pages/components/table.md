# Table

> Data table with caption and scope attributes, and an accessible scroll region for wide content.

- Use native `<table class="table">` inside a `.table-wrap` for surface, border, radius, and overflow.
- Use `<caption>`, `scope="col"`, and `scope="row"` for accessibility.
- Use `.text-end` for numeric columns and `.text-nowrap` for non-wrapping cells.
- For wide tables, make the wrapper an accessible scroll region with `role="region"`, `aria-labelledby`, and `tabindex="0"`.
- Tables stay content-first and neutral by default.
- `.table` is a static, content-first table. It provides no sorting, filtering, search, selection, pagination, or row actions. For an interactive data grid ("datatable"), use a dedicated component — see the [data grid template](../../demo/templates/data-grid.html), which themes `data-grid-component` with Actual CSS tokens.
- `.table` does not consume shared variants or intent colors (`--ui-bg` / `--intent`): a `.soft` + intent combo on a `<tr>` has no effect. To tint rows or headers, style them with a class of your own.

## Class reference

| Class            | Kind      | Description                                                  |
| ---------------- | --------- | ------------------------------------------------------------ |
| `.table-wrap`    | Component | Scroll container and outer chrome (surface, border, radius). |
| `.table`         | Component | The table itself; row and cell rules.                        |
| `.table.compact` | Density   | Tighter cell padding; font size and icons unchanged.         |

## Basic usage

```html demo
<div class="table-wrap">
  <table class="table">
    <caption>Team members</caption>
    <thead>
      <tr>
        <th scope="col">Name</th>
        <th scope="col">Email</th>
        <th scope="col">Role</th>
        <th scope="col">Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Alice Johnson</td>
        <td>alice@example.com</td>
        <td>Admin</td>
        <td><span class="badge success soft">Active</span></td>
      </tr>
      <tr>
        <td>Bob Smith</td>
        <td>bob@example.com</td>
        <td>Editor</td>
        <td><span class="badge success soft">Active</span></td>
      </tr>
      <tr>
        <td>Carol White</td>
        <td>carol@example.com</td>
        <td>Viewer</td>
        <td><span class="badge secondary soft">Pending</span></td>
      </tr>
    </tbody>
  </table>
</div>
```

## Accessible scroll region

For wide tables, add `role="region"`, `aria-labelledby`, and `tabindex="0"` to
the wrapper so keyboard users can scroll it. `--table-min` sets the minimum
table width before the wrapper scrolls horizontally.

```html demo
<div class="table-wrap" role="region" aria-labelledby="revenue-table" tabindex="0">
  <table class="table" style="--table-min: 64rem">
    <caption id="revenue-table">Revenue by month</caption>
    <thead>
      <tr>
        <th scope="col">Month</th>
        <th scope="col">Plan</th>
        <th scope="col" class="text-end">Revenue</th>
        <th scope="col" class="text-end">Churn</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>March 2026</td>
        <td>Team</td>
        <td class="text-end text-nowrap">$42,128</td>
        <td class="text-end text-nowrap">1.2%</td>
      </tr>
      <tr>
        <td>April 2026</td>
        <td>Team + Business</td>
        <td class="text-end text-nowrap">$48,902</td>
        <td class="text-end text-nowrap">0.9%</td>
      </tr>
      <tr>
        <td>May 2026</td>
        <td>Team + Business</td>
        <td class="text-end text-nowrap">$53,470</td>
        <td class="text-end text-nowrap">0.7%</td>
      </tr>
    </tbody>
  </table>
</div>
```

## Sticky headers

Frozen header row, fixed header, frozen first column. `.table-wrap` scrolls
horizontally, which makes it a scroll container on both axes: a sticky
`thead` sticks inside the wrap, never to the page. Pick the scroller first.

**Header stuck to the page.** `overflow: clip` keeps the wrap's rounded clip
without making it a scroll container, so the header sticks to the page. The
wrap no longer scrolls: use it for a table that fits its column.

```css
.members-table {
  overflow: clip;
}

.members-table thead th {
  position: sticky;
  inset-block-start: 0; /* the height of a sticky page header, if any */
  background: var(--table-header-bg, var(--surface-subtle));
  box-shadow: inset 0 calc(var(--border-width) * -1) var(--border);
}
```

**Header and first column stuck in a scroll box.** Give the wrap a block size;
the header row sticks to its top and the row headers to its inline start.

```css
.revenue-table {
  max-block-size: 24rem;
  overflow: auto;
}

.revenue-table thead th {
  position: sticky;
  inset-block-start: 0;
  z-index: 1;
  background: var(--table-header-bg, var(--surface-subtle));
  box-shadow: inset 0 calc(var(--border-width) * -1) var(--border);
}

.revenue-table thead th:first-child {
  inset-inline-start: 0;
  z-index: 2;
}

.revenue-table tbody th {
  position: sticky;
  inset-inline-start: 0;
  background: var(--surface-raised);
}

.revenue-table tbody tr:hover > th {
  background-image: linear-gradient(var(--hover-overlay), var(--hover-overlay));
}

.revenue-table th[scope="rowgroup"] > span {
  position: sticky;
  inset-block-start: 3rem; /* below the header row */
}
```

- Sticky cells need an opaque fill, or the rows scroll through them. The fill
  also hides the row's hover band, so the hover rule repaints it on the cell.
- A collapsed border stays with the table, not the cell: the header's rule is
  an inset shadow so it travels with the row.
- A row-group label (`th scope="rowgroup"` with `rowspan`) cannot stick as a
  cell; wrap its text, and the wrapper sticks inside the spanning cell.
- Keep `role="region"`, `aria-labelledby` and `tabindex="0"` on the scroll box.

## Compact tables

`.compact` lowers cell padding and establishes compact density for controls or
spacing helpers inside cells. The text stays as set; a data-heavy table that
also wants condensed type sets `font-stretch` on itself. It is the same
vocabulary as `.card.compact`.

```html demo
<div class="table-wrap">
  <table class="table compact">
    <caption>Standings by position</caption>
    <thead>
      <tr>
        <th scope="col">Pos</th>
        <th scope="col">Name</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>1</td><td>John Nemo</td></tr>
      <tr><td>2</td><td>Jane Doe</td></tr>
      <tr><td>3</td><td>Ada Morgan</td></tr>
    </tbody>
  </table>
</div>
```

## Sliding row hover

The core hover switches each row's background instantly. For a highlight that
slides from row to row (animated hover, moving indicator), a theme anchors one
layer to the hovered row with CSS anchor positioning; the `material` theme in
`src/css/themes/material.css` is a recipe to copy. Browsers without anchor
positioning keep the core hover.

## When a table stops reading as a table

Responsive strategy is horizontal overflow: the wrap scrolls, the table keeps
its columns and its column scanability. No `data-label` restructuring, no
second representation of the data.

For datasets that no longer read well as a table on narrow screens, compose a
different view instead of restructuring the table: a `.list` / `.media` row
with badges and actions for a CRUD collection, [`.data-list`](data-list.md)
for one object's properties, or a dedicated data grid for interactive tables
(sorting, filtering, selection). Two views for two contexts is a feature, not
a duplication.

## CSS hooks

- `--table-cell-pad` — cell padding; `.compact` re-declares it tighter.
- `--table-min` — minimum table width before `.table-wrap` scrolls horizontally.
- `--table-header-bg`, `--table-header-fg` — header band fill and ink. Set
  them on a theme root rather than on `.table`: a data grid bridge reads the
  same pair, so the table and the grid share one header (see the
  [data grid template](../../demo/templates/data-grid.html)).
