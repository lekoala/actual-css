# One-time code input

> **Module** — import `actual-css/css/forms/otp` or `actual-css/css/forms/all`.

OTP presents one native input as separate visual cells. Keeping a single input
preserves paste, selection, autofill, password-manager, and
`autocomplete="one-time-code"` behavior without JavaScript.

```html demo
<label class="field">
  <span class="field-label">Verification code</span>
  <span class="otp">
    <input
      class="input"
      type="text"
      autocomplete="one-time-code"
      inputmode="numeric"
      maxlength="6"
      pattern="[0-9]{6}"
      required
      aria-describedby="otp-help"
    />
    <span aria-hidden="true"></span>
    <span aria-hidden="true"></span>
    <span aria-hidden="true"></span>
    <span aria-hidden="true"></span>
    <span aria-hidden="true"></span>
    <span aria-hidden="true"></span>
  </span>
  <span class="field-help" id="otp-help">Enter the six-digit code.</span>
</label>
```

Add exactly one visual `span` per expected character. Their count must match
`maxlength` and the input's validation pattern. `inputmode="numeric"` requests
a numeric keyboard but does not enforce numeric input; validate the submitted
value as usual.

The component follows shared `.sm` and `.lg` density through `--control-size`.
Use `aria-invalid="true"` for explicit invalid state, or place it in the
standard `.needs-validation.was-validated` form flow.

## CSS hooks

- `--otp-cell-size` — width and height of every cell; follows `--control-size`.
- `--otp-gap` — space between cells.
- `--otp-font-size` — code glyph size; density does not change typography.

Surface, border, focus, disabled, and danger colors come from the shared form
and theme tokens.
