# Rating

> Integer star rating built from native radio inputs, and a read-only display of a rating.

Each star is a real `input[type="radio"]`, so submission, `required`, disabled
state, form reset, and keyboard navigation remain native. Keep values and DOM
order ascending. The cumulative fill and hover preview use `:has()` as a
progressive enhancement; older supported browsers show only the selected star
filled while the control remains fully functional.

## Class reference

| Class                 | Kind      | Description                      |
| --------------------- | --------- | -------------------------------- |
| `.rating`             | Component | Radio group presented as stars.  |
| `.rating[role="img"]` | Component | Read-only display of a value.    |
| `.sm` / `.lg`         | Size      | Smaller or larger star geometry. |

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

## Read-only display

To show a rating rather than collect one (reviews, testimonials, average
score, star display), use one element with `role="img"` and the value in
`--rating-value`. Fractions draw a partial star. The `aria-label` carries the
value; without `role="img"` nothing is drawn, so a display cannot ship
without an accessible name. Do not present a value with disabled radios.

```html demo
<p>
  <span class="rating" role="img" aria-label="4.5 out of 5 stars" style="--rating-value: 4.5"></span>
  4.5 from 312 reviews
</p>

<span class="rating sm primary" role="img" aria-label="7 out of 10" style="--rating-value: 7; --rating-max: 10"></span>
```

Stars line up with an input `.rating` of the same size, and `.sm`, `.lg` and
intent classes apply as above. The fill follows the writing direction. In
forced-colors mode the filled share is painted in system colors.

## In context

Stars sit at the scale of the text and controls around them: a form field with
help text, a review summary, a review line, a row beside a field and a button.

```html demo
<div class="stack">
  <fieldset class="field">
    <legend class="field-label">Rate this release</legend>
    <div class="rating">
      <input type="radio" name="release" value="1" aria-label="1 star" />
      <input type="radio" name="release" value="2" aria-label="2 stars" />
      <input type="radio" name="release" value="3" aria-label="3 stars" />
      <input type="radio" name="release" value="4" aria-label="4 stars" checked />
      <input type="radio" name="release" value="5" aria-label="5 stars" />
    </div>
    <small class="field-help">How did this version work for you?</small>
  </fieldset>

  <p class="cluster">
    <span class="rating sm" role="img" aria-label="4.6 out of 5" style="--rating-value: 4.6"></span>
    <strong>4.6</strong> <span class="muted">· 128 reviews</span>
  </p>

  <p class="cluster">
    <span class="rating" role="img" aria-label="3.5 out of 5" style="--rating-value: 3.5"></span>
    Great docs, slow build.
  </p>

  <div class="cluster">
    <input class="input" style="inline-size: 10rem" aria-label="Name" placeholder="Name" />
    <span class="rating" role="img" aria-label="4 out of 5" style="--rating-value: 4"></span>
    <button class="btn" type="button">Send</button>
  </div>
</div>
```

## Star shapes

`--rating-star` draws a star and `--rating-star-empty` an empty one; the empty
shape is the filled one unless set. An outline makes empty and filled differ by
shape, not only by color; give it an ink that reads as a line, such as
`--text-subtle`. The same hooks draw any other symbol, a heart here, in the
page ink.

```html demo
<div class="stack">
  <span class="rating" role="img" aria-label="3.5 out of 5"
        style="--rating-value: 3.5; --rating-empty: var(--text-subtle); --rating-star-empty: url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%222 2 16 16%22%3E%3CclipPath id=%22c%22%3E%3Cpath d=%22M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.922-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.783.57-1.838-.196-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292Z%22/%3E%3C/clipPath%3E%3Cpath d=%22M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.922-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.783.57-1.838-.196-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292Z%22 fill=%22none%22 stroke=%22black%22 stroke-width=%222.4%22 clip-path=%22url(%23c)%22/%3E%3C/svg%3E')"></span>
  <span class="rating" role="img" aria-label="4 out of 5"
        style="--rating-value: 4; --rating-color: var(--text); --rating-star: url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22%3E%3Cpath d=%22M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.6 4.5c2.1 0 3.6 1.2 4.4 2.6.8-1.4 2.3-2.6 4.4-2.6 3.6 0 5.7 3.9 4.2 7.3C19.5 16.4 12 21 12 21z%22/%3E%3C/svg%3E')"></span>
</div>
```

Set the hooks on the `.rating` element or in a rule that targets it: the
component declares its defaults there, so a value set on an ancestor is
overridden. A browser without `mask-composite` (Chromium before 120) draws
custom empty stars of a read-only display in the filled shape.

### Hooks

- `--rating-size` — size of each star; `.sm` and `.lg` set this hook.
- `--rating-gap` — visual space between stars without creating inactive hover zones.
- `--rating-color` — star color. Prefer an intent class for semantic color.
- `--rating-empty` — color of unselected stars; use a surface or border token.
- `--rating-star` — mask image used to draw a star; override it when a strict CSP disallows data URLs.
- `--rating-star-empty` — mask image of an empty star; follows `--rating-star` unless set.
- `--rating-value` — display only: the value shown, fractions allowed.
- `--rating-max` — display only: the number of stars.
