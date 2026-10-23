# Intent Nesting

An intent applies to the component carrying it. Nested components keep their
own default intent unless you give them one:

```html
<div class="alert danger">
  Something went wrong.
  <button class="btn" type="button">Dismiss</button>
  <button class="btn primary" type="button">Retry</button>
</div>
```

The alert uses danger colors, Dismiss stays neutral, and Retry uses primary.
Set an intent on each component that needs it.
