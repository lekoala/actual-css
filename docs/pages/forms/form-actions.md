# Form Actions

> `.form-actions` is a class-only flex row that closes a form. It may live
> inside or outside the `<form>` (see Detached Actions) and has an opt-in
> sticky variant (see Sticky Actions).

The default layout is a wrapping flex row: items are centered on the cross
axis and start-aligned on the main axis, with a default top margin that
separates the actions from the fields above.

```html
<form novalidate>
  <div class="stack">
    <!-- fields -->
  </div>

  <div class="form-actions">
    <button type="button" class="btn outline">Cancel</button>
    <button type="submit" class="btn primary">Save changes</button>
  </div>
</form>
```

## CSS hooks

The three layout hooks are unset by default and fall back to the values below.

- `--form-actions-align` — `center` — cross-axis alignment (`align-items`).
- `--form-actions-justify` — `flex-start` — main-axis distribution (`justify-content`).
- `--form-actions-margin-block-start` — `var(--space-50)` — top margin separating actions from the form.

### Common arrangements

Right-align the submit on wide rows:

```css
.form-actions {
  --form-actions-justify: flex-end;
}
```

Stretch each action to fill the full row width:

```css
.form-actions {
  --form-actions-align: stretch;
}
```

Because the hooks are inherited custom properties, set them on a page or
container to apply one arrangement to every `.form-actions` inside it.

> The sticky variant adds `--form-actions-sticky-block-offset`,
> `--form-actions-sticky-padding`, and `--form-actions-sticky-inline-offset` —
> see Sticky Actions. `.form-actions` is class-only and works inside or
> outside the form — see Detached Actions.