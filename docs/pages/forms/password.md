# Password Toggle

> A password field reveals its value through a linked button. The markup is a
> plain command invoker; the behavior ships with the full JS runtime
> (`actual-css/js/full`) and can also be imported independently
> (`actual-css/js/password`).

Point a `button` at the input with `commandfor` and
`command="--password-toggle"`. Use `.join` when the button should sit attached
to the field.

```html demo
<div class="field">
  <label class="field-label" for="pw">Password</label>
  <div class="join">
    <input class="input" type="password" id="pw" name="password"
           autocomplete="current-password" required />
    <button class="btn outline" type="button" commandfor="pw"
            command="--password-toggle" aria-controls="pw"
            aria-label="Show password" aria-pressed="false"><i class="ti ti-eye" aria-hidden="true"></i></button>
  </div>
</div>
```

Start with `aria-pressed="false"`; this makes the toggle semantics available
before JavaScript runs. The runtime flips the input between `type="password"`
and `type="text"` and mirrors the state on every linked trigger, which
`.btn[aria-pressed="true"]` already styles. Keep the trigger label stable
("Show password") — `aria-pressed` announces the state, so a label that flips
to "Hide" reads as a double negation to screen readers. Style an icon swap off
the attribute instead:

```css
[command="--password-toggle"][aria-pressed="true"] .icon-show { display: none; }
[command="--password-toggle"]:not([aria-pressed="true"]) .icon-hide { display: none; }
```

A revealed value does not survive navigation: a non-canceled form submit and
`pagehide` both revert the input to hidden, so back navigation cannot land on
a readable password. A canceled submit (failed validation, ajax) keeps the
value revealed.
