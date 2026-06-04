# Forms

Use `.field`, `.label`, `.input`, `.textarea`, `.select`, and `.help`.

```html
<label class="field">
  <span class="label">Email</span>
  <input class="input" type="email" placeholder="you@example.com">
  <span class="help">We will never share your email.</span>
</label>
```

Error example:

```html
<label class="field danger">
  <span class="label">Email</span>
  <input class="input" type="email" aria-invalid="true">
  <span class="help">Enter a valid email address.</span>
</label>
```
