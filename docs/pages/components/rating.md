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

## Anatomy

```text
fieldset.field-group.flush     + .field with help or error text
├── legend.field-label         names the group
└── .rating
    └── input[type="radio"]    ×1..N, ascending values, aria-label each

.rating[role="img"]            empty; aria-label and --rating-value
```

## Rate this item

```html demo
<fieldset class="field-group flush">
  <legend class="field-label">Rate this item</legend>
  <div class="rating">
    <input type="radio" name="item" value="1" aria-label="1 star" />
    <input type="radio" name="item" value="2" aria-label="2 stars" />
    <input type="radio" name="item" value="3" aria-label="3 stars" checked />
    <input type="radio" name="item" value="4" aria-label="4 stars" />
    <input type="radio" name="item" value="5" aria-label="5 stars" />
  </div>
</fieldset>
```

Use a visible `<legend>` to name the group and an `aria-label` on every radio
to name its value. `.field-group.flush` drops the native fieldset frame. Add
`.field` when the group holds help or error text: it spaces them and shows the
validation error. In forced-colors mode the stars deliberately return to
native platform radios so checked and focus states remain unambiguous.

## Required rating

Add `required` to the radios. With [form validation](../forms/validation.md),
the `.field-error` appears once the reader leaves the stars empty or submits,
never on page load, and picking a star clears it.

```html demo
<form class="stack needs-validation" data-enhance="validation" novalidate>
  <fieldset class="field field-group flush">
    <legend class="field-label">Rate your stay</legend>
    <div class="rating">
      <input type="radio" name="stay" value="1" aria-label="1 star" required aria-describedby="stay-error" />
      <input type="radio" name="stay" value="2" aria-label="2 stars" required aria-describedby="stay-error" />
      <input type="radio" name="stay" value="3" aria-label="3 stars" required aria-describedby="stay-error" />
      <input type="radio" name="stay" value="4" aria-label="4 stars" required aria-describedby="stay-error" />
      <input type="radio" name="stay" value="5" aria-label="5 stars" required aria-describedby="stay-error" />
    </div>
    <span class="field-error" id="stay-error">Pick a rating to continue.</span>
  </fieldset>
  <div class="cluster">
    <button class="btn primary" type="submit">Send review</button>
  </div>
</form>
```

## Sizes and intents

Intent classes change the active color without changing the interaction model.

```html demo
<div class="cluster">
  <fieldset class="field-group flush">
    <legend class="field-label">Small rating</legend>
    <div class="rating primary sm">
      <input type="radio" name="small-rating" value="1" aria-label="1 star" />
      <input type="radio" name="small-rating" value="2" aria-label="2 stars" checked />
      <input type="radio" name="small-rating" value="3" aria-label="3 stars" />
    </div>
  </fieldset>

  <fieldset class="field-group flush">
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
<p class="cluster">
  <span class="rating" role="img" aria-label="4.6 out of 5 stars" style="--rating-value: 4.6"></span>
  <span><strong>4.6</strong> out of 5 from 128 reviews</span>
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
  <fieldset class="field field-group flush">
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

## Color and shape

Stars are gold by default. A neutral ink, outlined empty stars, a brand color,
or another symbol are each one hook away.

```html demo
<div class="stack">
  <p class="cluster">
    <span class="rating" role="img" aria-label="3.5 out of 5" style="--rating-value: 3.5"></span>
    <span class="muted">Default</span>
  </p>
  <p class="cluster">
    <span class="rating" role="img" aria-label="3.5 out of 5"
          style="--rating-value: 3.5; --rating-color: var(--text)"></span>
    <span class="muted">Neutral ink</span>
  </p>
  <p class="cluster">
    <span class="rating" role="img" aria-label="3.5 out of 5"
          style="--rating-value: 3.5; --rating-star-empty: var(--rating-star-outline); --rating-empty: var(--text-subtle)"></span>
    <span class="muted">Outlined empty stars</span>
  </p>
  <p class="cluster">
    <span class="rating" role="img" aria-label="4 out of 5"
          style="--rating-value: 4; --rating-color: var(--danger); --rating-star: url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22%3E%3Cpath d=%22M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.6 4.5c2.1 0 3.6 1.2 4.4 2.6.8-1.4 2.3-2.6 4.4-2.6 3.6 0 5.7 3.9 4.2 7.3C19.5 16.4 12 21 12 21z%22/%3E%3C/svg%3E')"></span>
    <span class="muted">Another symbol</span>
  </p>
</div>
```

The outline makes empty and filled stars differ by shape, not only by color;
give it an ink that reads as a line, such as `--text-subtle`. It outlines the
default star only: a custom `--rating-star` brings its own empty shape.

A theme sets the same hooks in a rule on `.rating`. The component declares its
defaults there, so a value set on `[data-theme]` or another ancestor is
overridden. Keep `var(--intent, …)` first so intent classes still apply. The
cyberpunk, neon and material demo themes each restyle the stars this way.

```css
[data-theme="mine"] .rating {
  --rating-color: var(--intent, var(--text));
  --rating-star-empty: var(--rating-star-outline);
  --rating-empty: var(--text-subtle);
}
```

The default gold is below 3:1 on a white surface. Where that matters, set a
darker `--rating-color`. A browser without `mask-composite` (Chromium before
120) draws custom empty stars of a read-only display in the filled shape.

### Hooks

- `--rating-size` — size of each star; `.sm` and `.lg` set this hook.
- `--rating-gap` — visual space between stars without creating inactive hover zones.
- `--rating-color` — star color. Prefer an intent class for semantic color.
- `--rating-empty` — color of unselected stars; `--text-subtle` suits an outline.
- `--rating-star` — mask image used to draw a star; override it when a strict CSP disallows data URLs.
- `--rating-star-empty` — mask image of an empty star; follows `--rating-star` unless set.
- `--rating-star-outline` — the default star as an outline, ready for `--rating-star-empty`.
- `--rating-value` — display only: the value shown, fractions allowed.
- `--rating-max` — display only: the number of stars.
