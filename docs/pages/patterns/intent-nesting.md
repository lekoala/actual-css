# Intent nesting

Apply an intent to each component independently, so nested buttons and controls keep their own colors.

```html
<div class="alert danger">
  Something went wrong.
  <button class="btn" type="button">Dismiss</button>
  <button class="btn primary" type="button">Retry</button>
</div>
```

The alert uses danger colors, Dismiss stays neutral, and Retry uses primary.
Nested components keep their default intent unless you give them one.
