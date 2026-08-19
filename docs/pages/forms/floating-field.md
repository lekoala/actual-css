# Floating labels

> **Optional** — import `actual-css/css/optional/floating-field` or `actual-css/css/optional`.

`.floating-field` turns a control and its label into a floating-label cell:
the label rests inside the control and floats to the top when the control is
focused or filled. It composes the existing `.field` layout and the text
controls (`.input`, `.textarea`, `.select`) with zero JavaScript.

The cell holds the control and its label only. Help and error messages stay in
the surrounding `.field`, otherwise the resting label centers on the whole
field instead of the control.

```html demo
<div class="field">
  <label class="floating-field">
    <input class="input" type="email" placeholder=" " aria-describedby="email-help" />
    <span class="field-label">Email</span>
  </label>
  <span class="field-help" id="email-help">We'll never share your email.</span>
</div>
```

Every `.input` and `.textarea` needs `placeholder=" "` so `:placeholder-shown`
can detect emptiness — the space keeps the placeholder invisible while making
the state detectable. `:autofill` is covered too, so a password manager that
prefills a field still lifts the label.

## Textarea

A textarea's resting label aligns with the first text line instead of centering
in the tall control.

```html demo
<div class="field">
  <label class="floating-field">
    <textarea class="textarea" rows="4" placeholder=" "></textarea>
    <span class="field-label">Message</span>
  </label>
</div>
```

## Select and date/time inputs

Selects have no `:placeholder-shown` signal, and date/time inputs render their
placeholder inconsistently (Firefox shows none). These controls stay floated in
every state, so their label always sits at the top.

```html demo
<div class="stack">
  <label class="floating-field">
    <select class="select">
      <option value="">Choose a country</option>
      <option>Belgium</option>
      <option>France</option>
      <option>Netherlands</option>
    </select>
    <span class="field-label">Country</span>
  </label>

  <label class="floating-field">
    <input class="input" type="date" />
    <span class="field-label">Start date</span>
  </label>
</div>
```

## Density

The reserved headroom responds to control density through `--control-size`:
`.sm` and `.lg` on the cell or an ancestor resize the control geometry and the
label spacing with it. Typography is untouched, as everywhere in the framework.
The floating label does add height — the headroom reserves a second vertical
line on top of the control's minimum size.

## CSS hooks

- `--floating-pad-block-start` — headroom reserved above the control for the
  floated label; defaults to half the control height plus one spacing step.

Validation and focus come from the existing form contracts: the control's
border and focus ring flip through `--form-invalid-border` and the shared
control focus rules. Coloring the label itself on focus or invalid state is
left to the surrounding recipe — the joined floating form in the
[blocks demo](../../demo/templates/blocks.html) shows one such recipe.

> Not currently compatible with `.input-icon`; use standard labels when an
> embedded leading icon is required.