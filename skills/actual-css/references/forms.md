# Forms

## Native semantics first

Actual CSS styles and progressively enhances native controls. Domain policy remains application/server responsibility.

Use documented form structure instead of recreating field spacing, helper/error layout, and invalid-state styling around anonymous wrappers.

## Keyboard intent vs filtering

`inputmode` changes keyboard intent; it does not constrain the value.

`data-filter` explicitly rewrites input and is therefore a stronger policy. Empty `data-filter` does nothing and should not infer behavior from `inputmode`.

Use application code for locale-specific numeric rules, currency rules, signed input, ranges, or other domain-specific policies.

## Masks

`data-mask` is for fixed shape, not semantic validity.

A value can match a shape and still be an impossible date, invalid account number, or otherwise invalid domain value.

## Telephone input

Do not mask phone numbers by default. Preserve user input and normalize/validate authoritative number semantics on the server.

If the installed Actual version exposes `tel-prefix`, treat it only as a coarse client-side origin policy, not phone-number validation.

## Validation

Native validation is the baseline. The optional validation enhancer adds state/focus behavior and a small rule system; it is not the application's validation architecture.

Typical structure:

```html
<form class="needs-validation" data-enhance="validation" novalidate>
  <label class="field">
    <span class="field-label">Email</span>
    <input class="input" type="email" required aria-describedby="email-error">
    <span class="field-error" id="email-error">Enter a valid email.</span>
  </label>
</form>
```

Keep help/error text connected with `aria-describedby`; keep invalid state synchronized with `aria-invalid`.

Server-side or AJAX validation remains authoritative for business rules.

Before depending on a custom rule name or exact enhancer behavior, check the installed docs/source.
