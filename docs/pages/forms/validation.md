# Validation

> Inline error feedback that respects assistive technology and form state.

**Related terms:** inline validation, field error.

## Class reference

| Class               | Kind        | Description                                                                     |
|---------------------|-------------|---------------------------------------------------------------------------------|
| `.field-error`      | Composition | Canonical inline error message; shown while the field is invalid.               |
| `.field-help`       | Composition | Canonical helper text; carries supporting copy before and after validation.     |
| `.field.danger`     | Modifier    | Manual invalid marking on the field wrapper.                                    |
| `.needs-validation` | Modifier    | Opt-in class for the validation enhancer and `:user-invalid` styling.           |
| `.was-validated`    | Modifier    | Added to the form by the enhancer after the first submit attempt.               |
| `.status-bar`       | Component   | Optional status element that shows `data-validation-message` on invalid submit. |

- `.field-error` is the canonical error message. It is wired to `aria-invalid="true"` via the input, so the visual border and the assistive-tech announcement move together.
- `.field-help` is the canonical helper text. It carries supporting copy before and after validation.
- Set `aria-invalid="true"` on the input. The `.field-error` element is linked via `aria-describedby`.
- `role="alert"` on `.field-error` is only required when the message is inserted dynamically. Static messages do not need it.

```html demo
<form novalidate>
  <div class="stack">
    <label class="field">
      <span class="field-label">Email</span>
      <input class="input" type="email"
             value="jane@"
             aria-invalid="true"
             aria-describedby="email-error" />
      <span class="field-error" id="email-error" role="alert">
        Enter a valid email address
      </span>
    </label>

    <label class="field">
      <span class="field-label">Username</span>
      <input class="input" type="text" value="janedoe" aria-describedby="username-help" />
      <span class="field-help" id="username-help">
        Username is available.
      </span>
    </label>
  </div>
</form>
```

## Optional JavaScript enhancer

Native validation first; the enhancer only adds state and focus behavior.

Actual CSS ships validation *styles*. Invalid fields are marked with `aria-invalid="true"` (or the manual `.field.danger` wrapper class). The default forms bundle imports `forms/validation.css`; custom builds may omit that file when validation styling is app-owned. A small enhancer (`actual-css/js/validation`), included in the full runtime (`actual-css/js/full`) and also importable on its own, prevents premature error display, marks invalid fields on blur and submit, focuses the first invalid field on submit, and supports a few custom rules. It is not a validation framework — server and AJAX validation stay in app code.

Opt in with the `.needs-validation` class. Importing the module registers the behavior; there is no init call.

```html demo
<form class="needs-validation" data-enhance="validation" data-validation-message="Please check the highlighted fields.">
  <div class="stack">
    <label class="field">
      <span class="field-label">Password</span>
      <input class="input" type="password" name="password" id="password" required
             minlength="8" maxlength="128"
             aria-describedby="password-error" />
      <span class="field-error" id="password-error">Enter a password.</span>
    </label>

    <label class="field">
      <span class="field-label">Confirm password</span>
      <input class="input" type="password" name="confirm" required
             data-validation-rules="same #password"
             aria-describedby="confirm-error" />
      <span class="field-error" id="confirm-error" role="alert">Passwords must match.</span>
    </label>
  </div>

  <div class="form-actions">
    <button class="btn primary" type="submit">Submit</button>
    <button class="btn neutral outline" type="reset">Reset</button>
  </div>
</form>
```

On blur, the enhancer sets `aria-invalid="true"` on the invalid field so visual and assistive-tech state move together. On submit, it adds `.was-validated` to the form and marks every invalid field. When the form is invalid it prevents submission, focuses the first invalid field, and dispatches a bubbling `actual:invalid` event with `{ form, firstInvalid, message }`. On reset, it clears all validation state — `.was-validated`, `aria-invalid`, `.field.danger`, and custom-validity messages — which native reset alone would leave behind.

The status bar (`actual-css/js/status`) auto-wires to that event: import it and add one status element, and the form's `data-validation-message` appears automatically on invalid submit — no manual listener.

```html demo
<form class="needs-validation" data-enhance="validation" data-validation-message="Please check the highlighted fields.">
  <div class="stack">
    <label class="field">
      <span class="field-label">Email</span>
      <input class="input" type="email" name="email" required
             aria-describedby="demo-email-error" />
      <span class="field-error" id="demo-email-error" role="alert">
        Enter a valid email.
      </span>
    </label>

    <label class="field">
      <span class="field-label">Quantity</span>
      <input class="input" name="quantity" inputmode="numeric" required
             data-validation-rules="digits"
             aria-describedby="demo-quantity-error" />
      <span class="field-error" id="demo-quantity-error" role="alert">
        Use digits only.
      </span>
    </label>

    <div class="field">
      <label class="choice">
        <input class="check" type="checkbox" name="terms" required
               aria-describedby="demo-terms-error" />
        <span>
          <span class="field-label">Accept the terms</span>
        </span>
      </label>
      <span class="field-error" id="demo-terms-error" role="alert">
        Required before continuing.
      </span>
    </div>

    <div class="field">
      <label class="choice">
        <input class="switch" type="checkbox" role="switch" name="confirm" required
               aria-describedby="demo-confirm-error" />
        <span>
          <span class="field-label">Confirm setup</span>
        </span>
      </label>
      <span class="field-error" id="demo-confirm-error" role="alert">
        Switch this on to submit.
      </span>
    </div>
    <div class="form-actions">
      <button class="btn primary" type="submit">Submit</button>
      <button class="btn neutral outline" type="reset">Reset</button>
    </div>
  </div>
</form>

<div class="status-bar" data-status role="status" aria-live="polite" aria-atomic="true"></div>
```

If you prefer to handle the summary yourself, listen for `actual:invalid` instead of importing the status module:

```js
document.addEventListener("actual:invalid", (event) => {
  const { firstInvalid, message } = event.detail;
  // e.g. scroll to firstInvalid, or route message to your own surface
});
```

### Built-in custom rules

Custom rules live in `data-validation-rules` as a comma-separated list; each rule may take space-separated options. The enhancer registers a few defaults:

- `same <selector>` — Value must equal the value of the element matched by `<selector>` (scoped to the field's form).
- `number` — Value is empty or a valid `Number`.
- `digits` — Value is empty or ASCII digits only.
- `alnum` — Value is empty or letters and digits only.
- `date` — Value is a valid date in `yyyy-mm-dd`, `dd/mm/yyyy`, `mm/dd/yyyy`, `dd.mm.yyyy`, `mm.dd.yyyy`, `dd-mm-yyyy`, or `mm-dd-yyyy` shape; rejects non-existent dates like `2026-02-29`. ISO remains the recommended wire format because servers can parse it without guessing.

Add your own with `FormValidator.registerRule(name, (value, el, ...opts) => boolean)`. The built-in rules treat empty values as valid so optional fields stay optional; custom rules should do the same when that behavior is wanted.

The `date` rule pairs naturally with `data-mask` — the mask structures input, the rule validates meaning. Same rule, different formats:

```html demo
<form class="stack needs-validation" data-enhance="validation" novalidate>
  <label class="field">
    <span class="field-label">Date (ISO)</span>
    <input class="input" name="date-iso"
           data-mask="9999-99-99"
           data-validation-rules="date"
           inputmode="numeric"
           autocomplete="off"
           placeholder="yyyy-mm-dd"
           aria-describedby="date-iso-help date-iso-error"
           required />
    <span class="field-help" id="date-iso-help">
      yyyy-mm-dd format.
    </span>
    <span class="field-error" id="date-iso-error">
      Enter a valid date.
    </span>
  </label>

  <label class="field">
    <span class="field-label">Date (European)</span>
    <input class="input" name="date-eu"
           data-mask="99/99/9999"
           data-validation-rules="date"
           inputmode="numeric"
           autocomplete="off"
           placeholder="dd/mm/yyyy"
           aria-describedby="date-eu-help date-eu-error"
           required />
    <span class="field-help" id="date-eu-help">
      dd/mm/yyyy format.
    </span>
    <span class="field-error" id="date-eu-error">
      Enter a valid date.
    </span>
  </label>

  <div class="form-actions">
    <button class="btn primary" type="submit">Submit</button>
    <button class="btn neutral outline" type="reset">Reset</button>
  </div>
</form>
```

Custom rules only run when the field has a value. Empty fields skip all custom rules — `required` is the sole gatekeeper for empty values. A custom date rule for a stricter app-specific format could look like:

```js
FormValidator.registerRule("iso-date", (value) => {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
});
```

### Server and AJAX validation

The enhancer never makes network calls. After a valid client submit, your own `form[data-ajax]` flow (see the JavaScript docs) performs the request and maps server errors back onto fields through the public API:

```js
import { FormValidator } from "actual-css/js/validation";

// server responded with field errors
FormValidator.setErrors(form, { email: "Already taken" });

// clear a single field once fixed
FormValidator.clearFieldError(form.elements.email);
```

`setErrors` resolves each name to a field, sets `aria-invalid`, the field's `.field-error` text, and `setCustomValidity` so the next submit stays blocked until corrected.

### State coverage

Invalid visuals converge across the three ways a field can be flagged:
`aria-invalid="true"`, `.needs-validation.was-validated :invalid`, and
`:user-invalid`. Each sets the danger border, and a checked or indeterminate
`.check`, `.radio`, or `.switch` also flips its fill to danger so border and
fill signal together. Choice cards surface the same invalid state on the card
border. The exact selector coverage is asserted by `tests/validation.test.js`.
