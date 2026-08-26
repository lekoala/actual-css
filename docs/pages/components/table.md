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

| Class           | Kind      | Description                                                  |
|-----------------|-----------|--------------------------------------------------------------|
| `.table-wrap`   | Component | Scroll container and outer chrome (surface, border, radius). |
| `.table`        | Component | The table itself; row and cell rules.                        |
| `.table.compact`| Density   | Tighter cell padding; typography is unchanged.               |

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

## Compact tables

`.compact` lowers the cell padding only — density never changes typography.
It is the same vocabulary as `.card.compact`.

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

## CSS hooks

- `--table-cell-pad` — cell padding; `.compact` re-declares it tighter.
- `--table-min` — minimum table width before `.table-wrap` scrolls horizontally.
