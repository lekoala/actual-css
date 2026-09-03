# Rating

> Integer star rating built from native radio inputs.

Each star is a real `input[type="radio"]`, so submission, `required`, disabled
state, form reset, and keyboard navigation remain native. Keep values and DOM
order ascending. The cumulative fill and hover preview use `:has()` as a
progressive enhancement; older supported browsers show only the selected star
filled while the control remains fully functional.

## Class reference

| Class         | Kind      | Description                      |
| ------------- | --------- | -------------------------------- |
| `.rating`     | Component | Radio group presented as stars.  |
| `.sm` / `.lg` | Size      | Smaller or larger star geometry. |

```html demo
<fieldset class="field">
  <legend class="field-label">Rate your experience</legend>
  <div class="rating">
    <input type="radio" name="experience" value="1" aria-label="1 star" />
    <input type="radio" name="experience" value="2" aria-label="2 stars" />
    <input type="radio" name="experience" value="3" aria-label="3 stars" checked />
    <input type="radio" name="experience" value="4" aria-label="4 stars" />
    <input type="radio" name="experience" value="5" aria-label="5 stars" />
  </div>
</fieldset>
```

Use a visible `<legend>` to name the group and an `aria-label` on every radio
to name its value. Add `required` to the radios when the form must receive a
rating. In forced-colors mode the stars deliberately return to native platform
radios so checked and focus states remain unambiguous.

Intent classes change the active color without changing the interaction model.

```html demo
<div class="cluster">
  <fieldset class="field">
    <legend class="field-label">Small rating</legend>
    <div class="rating primary sm">
      <input type="radio" name="small-rating" value="1" aria-label="1 star" />
      <input type="radio" name="small-rating" value="2" aria-label="2 stars" checked />
      <input type="radio" name="small-rating" value="3" aria-label="3 stars" />
    </div>
  </fieldset>

  <fieldset class="field">
    <legend class="field-label">Large rating</legend>
    <div class="rating danger lg">
      <input type="radio" name="large-rating" value="1" aria-label="1 star" />
      <input type="radio" name="large-rating" value="2" aria-label="2 stars" />
      <input type="radio" name="large-rating" value="3" aria-label="3 stars" />
      <input type="radio" name="large-rating" value="4" aria-label="4 stars" checked />
      <input type="radio" name="large-rating" value="5" aria-label="5 stars" />
    </div>
  </fieldset>
</div>
```

### Hooks

- `--rating-size` — size of each star; `.sm` and `.lg` set this hook.
- `--rating-gap` — visual space between stars without creating inactive hover zones.
- `--rating-color` — star color. Prefer an intent class for semantic color.
- `--rating-empty` — color of unselected stars; use a surface or border token.
- `--rating-star` — mask image used to draw a star; override it when a strict CSP disallows data URLs.
