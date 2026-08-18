# Switcher

Row that becomes a column when space gets tight, useful for small sets of panels.

> **Optional** — import `actual-css/css/optional/layout-extra` or `actual-css/css/optional/index`.

Use `.switcher` for rows that should become columns when space gets tight.

```html demo
<section class="switcher">
  <article class="card">
    <h3>Profile</h3>
    <p>Personal details and preferences.</p>
  </article>
  <article class="card">
    <h3>Security</h3>
    <p>Password and login settings.</p>
  </article>
  <article class="card">
    <h3>Billing</h3>
    <p>Invoices and payment methods.</p>
  </article>
</section>
```

This is useful for small sets of panels, not large card collections. Use `.grid` for repeatable collections.

## CSS hooks

- `--switcher-threshold` — container width at which the row becomes a column.

```css
.settings-panels {
  --switcher-threshold: 55rem;
}
```