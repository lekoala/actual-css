# Actions

Use `.actions` for a semantic list of actions.

It removes native list chrome and provides a baseline row layout (`display: flex`, wrap, shared gap). Compose with layout primitives only when you need a different direction or distribution.

```html demo
<div class="stack">
  <menu class="actions cluster">
    <li><button class="btn primary" type="button">Save</button></li>
    <li><button class="btn outline" type="button">Cancel</button></li>
  </menu>

  <menu class="actions stack">
    <li><a class="btn primary" href="/billing">Update billing</a></li>
    <li><a href="/support">Contact support</a></li>
  </menu>
</div>
```

Use `.actions` for:

- dialog actions
- alert actions
- card actions
- toolbar actions
- form submit/cancel groups

Use layout primitives for contextual spacing.

```html demo
<div class="alert warning stack">
  <p>Your billing method has expired.</p>

  <menu class="actions cluster">
    <li><a class="btn danger sm" href="/billing">Update billing</a></li>
    <li><a href="/support">Contact support</a></li>
  </menu>
</div>
```

Prefer composition over making each component reimplement action-list layout.

```css
/* Avoid */
.alert > menu {
  display: flex;
  gap: var(--space-20);
  padding: 0;
  list-style: none;
}
```