# Table

> Data table with caption and scope attributes, and an accessible scroll region for wide content.

- Use native `<table class="table">` inside a `.table-wrap` for surface, border, radius, and overflow.
- Use `<caption>`, `scope="col"`, and `scope="row"` for accessibility.
- Use `.text-end` for numeric columns and `.text-nowrap` for non-wrapping cells.
- For wide tables, make the wrapper an accessible scroll region with `role="region"`, `aria-labelledby`, and `tabindex="0"`.
- Tables stay content-first and neutral by default.

## Class reference

| Class | Kind | Description |
|---|---|---|
| `.table-wrap` | Component | Scroll container and outer chrome (surface, border, radius). |
| `.table` | Component | The table itself; row and cell rules. |

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

## CSS hooks

- `--table-cell-pad` — cell padding.
- `--table-min` — minimum table width before `.table-wrap` scrolls horizontally.
