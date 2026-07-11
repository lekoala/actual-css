# Forms

## Overview

> Cohesive set of form elements that share focus styles, helpers, and validation patterns.

- Form controls are styled with explicit classes, not by parent scope.
- Control classes: `.input`, `.textarea`, `.select`, `.check`, `.radio`, `.switch`, `.range`, `.file`.
- Reusable layout classes: `.field`, `.field-label`, `.field-help`, `.field-error`, `.field-group`, `.choice`, `.form-actions`, `.form-actions.sticky`.
- No floating labels.
- Proper focus style that preserves keyboard navigation.
- `.field-group` and `.choice` provide layout without depending on parent scope.
- Customizable select is progressive enhancement only — the native select remains the baseline.

```html
<form novalidate>
  <div class="stack">

    <label class="field">
      <span class="field-label">Full name <span class="required-mark" aria-hidden="true">*</span></span>
      <input class="input" type="text" autocomplete="name" required placeholder="Jane Doe" />
    </label>

    <label class="field">
      <span class="field-label">Email address <span class="required-mark" aria-hidden="true">*</span></span>
      <input class="input" type="email"
             autocomplete="email"
             required
             aria-invalid="true"
             aria-describedby="email-error"
             value="jane@" />
      <span class="field-error" id="email-error" role="alert">
        Enter a valid email address
      </span>
    </label>

    <label class="field">
      <span class="field-label">Website</span>
      <input class="input" type="url"
             autocomplete="url"
             aria-describedby="website-help"
             placeholder="https://example.com" />
      <span class="field-help" id="website-help">Your public portfolio or personal site</span>
    </label>

    <label class="field">
      <span class="field-label">Bio</span>
      <textarea class="textarea" aria-describedby="bio-help"
                maxlength="200"
                placeholder="Tell us a bit about yourself…"></textarea>
      <span class="field-help" id="bio-help">Max 200 characters. Shown on your public profile.</span>
    </label>

    <label class="field">
      <span class="field-label">Language</span>
      <select class="select" autocomplete="language">
        <option value="">Choose a language</option>
        <optgroup label="Available languages">
          <option value="en" selected>English</option>
          <option value="fr">Français</option>
          <option value="nl">Nederlands</option>
        </optgroup>
        <optgroup label="Not yet available">
          <option value="de" disabled>Deutsch</option>
        </optgroup>
      </select>
    </label>

    <fieldset class="field-group">
      <legend class="field-label">Availability</legend>
      <div class="stack">
        <label class="choice">
          <input class="radio" type="radio" name="availability" value="available" checked />
          <span>Available for work</span>
        </label>
        <label class="choice">
          <input class="radio" type="radio" name="availability" value="open" />
          <span>Open to opportunities</span>
        </label>
        <label class="choice">
          <input class="radio" type="radio" name="availability" value="unavailable" />
          <span>Not available</span>
        </label>
      </div>
    </fieldset>

    <label class="field">
      <span class="field-label">Experience level</span>
      <input class="range" type="range"
             min="0"
             max="10"
             value="5"
             aria-valuetext="5 years"
             aria-describedby="range-help" />
      <span class="field-help" id="range-help">Years of professional experience</span>
    </label>

    <label class="choice">
      <input class="switch" type="checkbox" role="switch" checked />
      <span>
        <span class="field-label">Email notifications</span>
        <span class="field-help">Receive updates about your account activity</span>
      </span>
    </label>

    <label class="choice">
      <input class="check" type="checkbox" />
      <span>
        I agree to the <a href="#">terms of service</a>
        <span class="field-help">Required to create an account</span>
      </span>
    </label>

    <label class="field">
      <span class="field-label">Profile picture</span>
      <input class="file" type="file" accept="image/*" aria-describedby="file-help" />
      <span class="field-help" id="file-help">JPG, PNG or WebP — max 2 MB</span>
    </label>

    <label class="field">
      <span class="field-label">Username</span>
      <input class="input" type="text"
             value="janedoe"
             disabled
             aria-describedby="username-help" />
      <span class="field-help" id="username-help">Contact support to change your username</span>
    </label>

  </div>

  <div class="form-actions">
    <button type="button" class="btn outline">Cancel</button>
    <button type="submit" class="btn primary">Save changes</button>
  </div>
</form>
```

### Notes

- `required` is enough on native inputs. `aria-required="true"` is redundant and not used in these examples.
- `required` is the semantic source of truth. Add `<span class="required-mark" aria-hidden="true">*</span>` inside a label only when a visual required marker is wanted; the framework does not add one automatically.
- `.field` is the canonical field wrapper. It works on `<label>` and `<div>`.
- `.field-label` is element-agnostic. Use it on `<span>` inside a wrapped label, on `<label for="…">` in a detached layout, or on `<legend>` inside a fieldset.
- `.field-group` styles a `<fieldset class="field-group">` as a grouped field container.
- Use native `<optgroup>` and `disabled` options in `.select` controls when applicable; the customizable picker preserves both as a progressive enhancement.
- `.choice` is the choice-label API. Use `.check` or `.radio` on the nested control. The control goes first, the label group second, so multi-line labels align the control with the first line.
- For a switch, use `class="switch"` and `role="switch"`.
- Core range controls stay native and are enhanced by `accent-color`. An optional richer range skin may come later if real projects need it.
- `.form-actions` carries a default top margin. Override it with `--form-actions-margin-block-start`. It is class-only and may live inside or outside `<form>`. See Detached Actions below.
- `.join` visually joins adjacent controls into a single unit. Use `.join-addon` for static prefix/suffix content. The container still carries `role="group"` for accessibility.

### Optional automatic required marks

If a form consistently marks every required field, opt into automatic visual markers in application CSS. Scope the rule to that form so other forms stay explicit, and retain a per-field opt-out:

```css
form[data-required-marks="auto"]
  .field:not([data-required-mark="none"]):has(:required)
  > .field-label::after {
  content: " *";
  color: var(--danger);
}
```

`required` remains the accessible source of truth; this recipe adds only a visual cue. Use `data-required-mark="none"` on a `.field` when a required control should not receive the generated marker.

## States And Sizes

> Read-only, disabled, and shared size modifiers for form controls.

Use `readonly` for text-like values that can still be focused, selected, and submitted. Use `disabled` for unavailable controls that should not receive focus or submit a value.

The `.sm` and `.lg` modifiers set the shared control tokens used by inputs, selects, textareas, buttons, and switches. Put the modifier on the control itself, or on a `.field` wrapper when the whole field should share that size.

```html
<form novalidate>
  <fieldset class="field-group">
    <legend class="field-label">Text control states</legend>
    <div class="stack container-query">
      <div class="grid-3 items-start">
        <label class="field">
          <span class="field-label">Editable</span>
          <input class="input" type="text" value="Ocean Beach Clinic" />
        </label>

        <label class="field">
          <span class="field-label">Read-only</span>
          <input class="input" type="text" value="INV-2048" readonly />
          <span class="field-help">Focusable and submitted with the form.</span>
        </label>

        <label class="field">
          <span class="field-label">Disabled</span>
          <input class="input" type="text" value="Locked by billing" disabled />
          <span class="field-help">Unavailable and not submitted.</span>
        </label>
      </div>

      <div class="grid-3 items-start">
        <label class="field">
          <span class="field-label">Editable notes</span>
          <textarea class="textarea">Patient asked for an invoice copy.</textarea>
        </label>

        <label class="field">
          <span class="field-label">Read-only notes</span>
          <textarea class="textarea" readonly>Insurance details imported from the patient record.</textarea>
        </label>

        <label class="field">
          <span class="field-label">Disabled notes</span>
          <textarea class="textarea" disabled>Notes are disabled until the transaction is selected.</textarea>
        </label>
      </div>
    </div>
  </fieldset>

  <fieldset class="field-group">
    <legend class="field-label">Choice and select states</legend>
    <div class="stack container-query">
      <div class="grid-3 items-start">
        <label class="field">
          <span class="field-label">Editable select</span>
          <select class="select">
            <option>Card</option>
            <option>Bank transfer</option>
            <option>Cash</option>
          </select>
        </label>

        <label class="field">
          <span class="field-label">Invalid select</span>
          <select class="select" aria-invalid="true">
            <option>Choose a method</option>
            <option>Card</option>
            <option>Bank transfer</option>
          </select>
          <span class="field-error">Choose a payment method.</span>
        </label>

        <label class="field">
          <span class="field-label">Disabled select</span>
          <select class="select" disabled>
            <option>Card</option>
            <option>Bank transfer</option>
            <option>Cash</option>
          </select>
        </label>
      </div>

      <div class="grid-5 items-start">
        <label class="choice">
          <input class="check" type="checkbox" />
          <span>
            <span class="field-label">Unchecked checkbox</span>
            <span class="field-help">Available and not selected.</span>
          </span>
        </label>

        <label class="choice">
          <input class="check" type="checkbox" checked />
          <span>
            <span class="field-label">Checked checkbox</span>
            <span class="field-help">Available and selected.</span>
          </span>
        </label>

        <label class="choice">
          <input class="check" type="checkbox" checked disabled />
          <span>
            <span class="field-label">Disabled checked</span>
            <span class="field-help">Selected but unavailable.</span>
          </span>
        </label>

        <label class="choice">
          <input class="check" type="checkbox" disabled />
          <span>
            <span class="field-label">Disabled unchecked</span>
            <span class="field-help">Unavailable and not selected.</span>
          </span>
        </label>

        <label class="choice">
          <input class="check" type="checkbox" id="indet-demo" />
          <span>
            <span class="field-label">Indeterminate checkbox</span>
            <span class="field-help">Partially selected — set via <code>element.indeterminate = true</code>. Try it: <button class="btn text sm" type="button" onclick="document.getElementById('indet-demo').indeterminate = !document.getElementById('indet-demo').indeterminate">toggle</button></span>
          </span>
        </label>
      </div>

      <div class="grid-4 items-start">
        <label class="choice">
          <input class="radio" type="radio" name="demo-radio-state" />
          <span>
            <span class="field-label">Unselected radio</span>
            <span class="field-help">Available and not selected.</span>
          </span>
        </label>

        <label class="choice">
          <input class="radio" type="radio" name="demo-radio-state" checked />
          <span>
            <span class="field-label">Selected radio</span>
            <span class="field-help">Available and selected.</span>
          </span>
        </label>

        <label class="choice">
          <input class="radio" type="radio" name="demo-radio-disabled" checked disabled />
          <span>
            <span class="field-label">Disabled selected</span>
            <span class="field-help">Selected but unavailable.</span>
          </span>
        </label>

        <label class="choice">
          <input class="radio" type="radio" name="demo-radio-disabled" disabled />
          <span>
            <span class="field-label">Disabled unselected</span>
            <span class="field-help">Unavailable and not selected.</span>
          </span>
        </label>
      </div>

      <div class="grid-4 items-start">
        <label class="choice">
          <input class="switch" type="checkbox" role="switch" />
          <span>
            <span class="field-label">Switch off</span>
            <span class="field-help">Available and inactive.</span>
          </span>
        </label>

        <label class="choice">
          <input class="switch" type="checkbox" role="switch" checked />
          <span>
            <span class="field-label">Switch on</span>
            <span class="field-help">Available and enabled.</span>
          </span>
        </label>

        <label class="choice">
          <input class="switch" type="checkbox" role="switch" checked disabled />
          <span>
            <span class="field-label">Disabled on</span>
            <span class="field-help">On but unavailable.</span>
          </span>
        </label>

        <label class="choice">
          <input class="switch" type="checkbox" role="switch" disabled />
          <span>
            <span class="field-label">Disabled off</span>
            <span class="field-help">Off and unavailable.</span>
          </span>
        </label>
      </div>
    </div>
  </fieldset>

  <fieldset class="field-group">
    <legend class="field-label">Control sizes</legend>
    <div class="stack container-query">
      <div class="grid-3 items-start">
        <label class="field sm">
          <span class="field-label">Small field</span>
          <input class="input" type="text" value="sm" />
        </label>

        <label class="field">
          <span class="field-label">Default field</span>
          <input class="input" type="text" value="default" />
        </label>

        <label class="field lg">
          <span class="field-label">Large field</span>
          <input class="input" type="text" value="lg" />
        </label>
      </div>

      <div class="grid-3 items-start">
        <label class="field sm">
          <span class="field-label">Small select</span>
          <select class="select">
            <option>Compact</option>
          </select>
        </label>

        <label class="field">
          <span class="field-label">Default select</span>
          <select class="select">
            <option>Default</option>
          </select>
        </label>

        <label class="field lg">
          <span class="field-label">Large select</span>
          <select class="select">
            <option>Comfortable</option>
          </select>
        </label>
      </div>

      <div class="grid-3 items-start">
        <label class="field sm">
          <span class="field-label">Small textarea</span>
          <textarea class="textarea" rows="2">Short note</textarea>
        </label>

        <label class="field">
          <span class="field-label">Default textarea</span>
          <textarea class="textarea" rows="2">Default note</textarea>
        </label>

        <label class="field lg">
          <span class="field-label">Large textarea</span>
          <textarea class="textarea" rows="2">Comfortable note</textarea>
        </label>
      </div>

      <div class="grid-3 items-start">
        <button class="btn outline sm" type="button">Small</button>
        <button class="btn outline" type="button">Default</button>
        <button class="btn outline lg" type="button">Large</button>
      </div>

      <div class="grid-4 items-start">
        <label class="choice sm">
          <input class="check" type="checkbox" checked />
          <span>Small checkbox</span>
        </label>
        <label class="choice">
          <input class="check" type="checkbox" checked />
          <span>Default checkbox</span>
        </label>
        <label class="choice lg">
          <input class="check" type="checkbox" checked />
          <span>Large checkbox</span>
        </label>
        <label class="choice">
          <input class="check" type="checkbox" id="indet-size" />
          <span>Indeterminate <button class="btn text sm" type="button" onclick="document.getElementById('indet-size').indeterminate = !document.getElementById('indet-size').indeterminate">toggle</button></span>
        </label>
      </div>

      <div class="grid-3 items-start">
        <label class="choice sm">
          <input class="radio" type="radio" name="demo-radio-size" checked />
          <span>Small radio</span>
        </label>
        <label class="choice">
          <input class="radio" type="radio" name="demo-radio-size" />
          <span>Default radio</span>
        </label>
        <label class="choice lg">
          <input class="radio" type="radio" name="demo-radio-size" />
          <span>Large radio</span>
        </label>
      </div>

      <div class="grid-3 items-start">
        <label class="choice sm">
          <input class="switch" type="checkbox" role="switch" checked />
          <span>Small switch</span>
        </label>
        <label class="choice">
          <input class="switch" type="checkbox" role="switch" checked />
          <span>Default switch</span>
        </label>
        <label class="choice lg">
          <input class="switch" type="checkbox" role="switch" checked />
          <span>Large switch</span>
        </label>
      </div>
    </div>
  </fieldset>
</form>
```

## Labels

> The field wrapper is `.field`. Choose between a wrapped `<label>` and a detached `for`/`id` pair based on the layout.

Use a **wrapped label** for simple hand-authored forms. The whole label area becomes the click target, there is no `id` noise, and the markup is harder to break.

```html
<label class="field">
  <span class="field-label">Full name</span>
  <input class="input" type="text" name="name" autocomplete="name" />
</label>
```

Use **`for`/`id`** when the layout needs the label and control in different grid areas, when the markup is generated by a backend or form library, or when a single label is paired with multiple controls. `.field-label` is element-agnostic, so it works on a detached `<label>`.

```html
<div class="field">
  <label class="field-label" for="profile-email">
    Email address <span class="required-mark" aria-hidden="true">*</span>
  </label>
  <input class="input"
         id="profile-email"
         name="email"
         type="email"
         autocomplete="email"
         required
         aria-describedby="profile-email-help" />
  <span class="field-help" id="profile-email-help">
    We only use this for account notifications.
  </span>
</div>
```

The mixed shape `<label for="x">…<input id="x"></label>` is allowed by the spec but rarely useful. Prefer either pure wrapped or pure `for`/`id`.

## Joined Controls

> Use `.join` when controls need to be visually joined into a single unit.

Add `.join` to the wrapper that groups the controls. Use `.join-addon` for static prefix/suffix content such as currency symbols, units, or protocol text. Action buttons inside the group should use `.btn`. The wrapper should still carry `role="group"` with a label for accessibility.

When composing source files manually, import `components/join.css` after the controls it groups. `.join` writes child border-radius longhands directly so joined corners win at equal specificity.

```html
<div class="field">
  <label class="field-label" id="amount-label" for="amount">Amount</label>
  <div class="join" role="group" aria-labelledby="amount-label">
    <span class="join-addon">$</span>
    <input class="input" id="amount" name="amount" inputmode="decimal" />
    <button class="btn outline" type="button">Clear</button>
  </div>
  <span class="field-help">Enter the invoice total before tax.</span>
</div>
```

`.join` handles border-radius and border collapsing between adjacent children. It works with any direct child — `.input`, `.btn`, `.select`, or `.join-addon`.
When an `.input`, `.textarea`, or `.select` receives keyboard-relevant focus,
the focus ring surrounds the complete joined field. Attached buttons keep their
own focus indicator when reached directly, so the actionable segment remains
identifiable.

## Input Policy

> Native input intent first. Actual's runtime filters values only when explicitly asked, and fixed-shape masks stay opt-in through `data-mask`.

`inputmode` changes the virtual keyboard but does not constrain the value. Actual
does not filter plain `inputmode` fields by default because numeric entry often
needs temporary, signed, grouped, or locale-specific values while the user types.

When the JavaScript runtime is loaded, Actual enhances `input[data-filter]`.
Textareas are left alone.

Add an explicit `data-filter` value when the field should enforce one of
Actual's small built-in filters. Unsupported filter names are ignored. An
empty `data-filter` never filters — `inputmode` is not read as a fallback,
even when it is `numeric` or `decimal`. `data-filter="numeric"` /
`data-filter="decimal"` are intentionally destructive (they rewrite the
value as the user types), unlike `inputmode`, which only hints the virtual
keyboard.

```html
<label class="field">
  <span class="field-label">Quantity</span>
  <input class="input" inputmode="numeric" data-filter="numeric" placeholder="42" />
</label>
```

```html
<label class="field">
  <span class="field-label">Amount</span>
  <input class="input" inputmode="decimal" data-filter="decimal" placeholder="12.34" />
</label>
```

### Built-in filters

The built-in filters are intentionally narrow. They are input helpers, not
domain validation.

- `numeric` — Keeps ASCII digits only: `0` through `9`.
- `decimal` — Converts `,` to `.`, keeps ASCII digits, and keeps the first `.` separator.
- `lower` — Converts the value with `toLocaleLowerCase()`.
- `upper` — Converts the value with `toLocaleUpperCase()`.
- `letters` — Keeps Unicode letters only. Digits, punctuation, symbols, and spaces are removed.
- `slug` — Normalizes accents, lowercases text, turns runs of non-letter and non-digit characters into `-`, collapses repeated `-`, and trims edge separators.

During direct typing, `slug` may keep a trailing `-` until the next character so
words do not merge while the user is still entering text.

Filters can be piped with `|` when a field needs more than one transform. They
run from left to right.

```html
<label class="field">
  <span class="field-label">Slug</span>
  <input class="input" data-filter="lower|slug" autocomplete="off" placeholder="release-notes" />
</label>
```

```html
<label class="field">
  <span class="field-label">Code</span>
  <input class="input" data-filter="upper|letters" autocomplete="off" placeholder="ABC" />
</label>
```

For signed numbers, locale formatting, currency rules, time ranges, or
app-specific character policies, use application code. Those rules are domain
policy, not a framework default. See [JavaScript](javascript.md) for custom
filter patterns built on `enhance()`.

### Pattern mask

Use `data-mask` when the input has a fixed shape. Tokens are `9` for a digit,
`a` for a letter, and `*` for any character.

```html
<label class="field">
  <span class="field-label">Reference</span>
  <input class="input" data-mask="aaa-999" autocomplete="off" placeholder="abc-123" />
</label>
```

```html
<label class="field">
  <span class="field-label">Date</span>
  <input class="input" data-mask="9999-99-99" inputmode="numeric" autocomplete="off" placeholder="yyyy-mm-dd" />
</label>
```

Masks enforce shape, not domain validity. Use application validation when a date
must reject impossible values such as `2026-13-40`.

## Password Toggle

> A password field reveals its value through a linked button. The markup is a
> plain command invoker; the behavior ships with the JS runtime
> (`actual-css/js` or `actual-css/js/password`).

Point a `button` at the input with `commandfor` and
`command="--password-toggle"`. Use `.join` when the button should sit attached
to the field.

```html
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

## Detached Actions

> `.form-actions` is class-only. It may live inside or outside the `<form>`. Use the native `form` attribute to connect a detached submit button to its form.

The simplest case stays inside the form.

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

For sticky page footers, dialog footers, card footers, and split layouts, detach the actions and connect the submit button with `form="<id>"`.

```html
<form id="profile-form" novalidate>
  <div class="stack">
    <!-- long form fields -->
  </div>
</form>

<footer class="form-actions">
  <button type="button" class="btn outline">Cancel</button>
  <button type="submit" class="btn primary" form="profile-form">
    Save changes
  </button>
</footer>
```

For multiple submit intents, pair the `form` attribute with `formaction`. The form has one action; each submit button can override it.

```html
<form id="article-form"
      action="/articles/publish"
      method="post">
  <!-- fields -->
</form>

<div class="form-actions">
  <button type="submit"
          class="btn outline"
          form="article-form"
          formaction="/articles/draft">
    Save draft
  </button>
  <button type="submit"
          class="btn primary"
          form="article-form">
    Publish
  </button>
</div>
```

## Sticky Actions

> Use `.form-actions sticky` when long forms need reachable submit actions while scrolling.

### Inside the form

The `<form>` is the bounding parent. The sticky stays pinned to the viewport bottom while the form is taller than the viewport, then releases when the form's bottom edge reaches it.

Scroll the page to see the actions stay reachable.

```html
<form novalidate>
  <div class="stack">
    <label class="field">
      <span class="field-label">Full name <span class="required-mark" aria-hidden="true">*</span></span>
      <input class="input" type="text" autocomplete="name" required placeholder="Jane Doe" />
    </label>

    <label class="field">
      <span class="field-label">Email <span class="required-mark" aria-hidden="true">*</span></span>
      <input class="input" type="email" autocomplete="email" required />
    </label>

    <label class="field">
      <span class="field-label">Phone</span>
      <input class="input" type="tel" autocomplete="tel" />
    </label>

    <label class="field">
      <span class="field-label">Bio</span>
      <textarea class="textarea" rows="4" placeholder="Tell us about yourself…"></textarea>
    </label>

    <label class="field">
      <span class="field-label">Website</span>
      <input class="input" type="url" autocomplete="url" placeholder="https://example.com" />
    </label>

    <label class="field">
      <span class="field-label">Language</span>
      <select class="select">
        <option>English</option>
        <option>Français</option>
        <option>Deutsch</option>
      </select>
    </label>

    <label class="field">
      <span class="field-label">Experience level</span>
      <input class="range" type="range" min="0" max="10" value="5" />
    </label>

    <label class="field">
      <span class="field-label">Profile picture</span>
      <input class="file" type="file" accept="image/*" />
    </label>

    <fieldset class="field-group">
      <legend class="field-label">Theme</legend>
      <div class="stack">
        <label class="choice">
          <input class="radio" type="radio" name="theme" value="light" checked />
          <span>Light</span>
        </label>
        <label class="choice">
          <input class="radio" type="radio" name="theme" value="dark" />
          <span>Dark</span>
        </label>
        <label class="choice">
          <input class="radio" type="radio" name="theme" value="auto" />
          <span>System</span>
        </label>
      </div>
    </fieldset>

    <label class="choice">
      <input class="check" type="checkbox" />
      <span>Email notifications</span>
    </label>
  </div>

  <div class="form-actions sticky">
    <button type="button" class="btn outline">Cancel</button>
    <button type="submit" class="btn primary">Save changes</button>
  </div>
</form>
```

### Detached from the form

For a sticky page footer, dialog footer, or card footer, detach the actions and connect the submit button with the `form` attribute. The bounding parent becomes the wrapper that holds both the form and the actions.

Scroll the page to see the detached footer stay reachable.

```html
<form id="account-form" novalidate>
  <div class="stack">
    <label class="field">
      <span class="field-label">Full name <span class="required-mark" aria-hidden="true">*</span></span>
      <input class="input" type="text" autocomplete="name" required placeholder="Jane Doe" />
    </label>

    <label class="field">
      <span class="field-label">Email <span class="required-mark" aria-hidden="true">*</span></span>
      <input class="input" type="email" autocomplete="email" required />
    </label>

    <label class="field">
      <span class="field-label">Phone</span>
      <input class="input" type="tel" autocomplete="tel" />
    </label>

    <label class="field">
      <span class="field-label">Bio</span>
      <textarea class="textarea" rows="4" placeholder="Tell us about yourself…"></textarea>
    </label>

    <label class="field">
      <span class="field-label">Website</span>
      <input class="input" type="url" autocomplete="url" placeholder="https://example.com" />
    </label>

    <label class="field">
      <span class="field-label">Language</span>
      <select class="select">
        <option>English</option>
        <option>Français</option>
        <option>Deutsch</option>
      </select>
    </label>

    <label class="field">
      <span class="field-label">Experience level</span>
      <input class="range" type="range" min="0" max="10" value="5" />
    </label>

    <label class="field">
      <span class="field-label">Profile picture</span>
      <input class="file" type="file" accept="image/*" />
    </label>

    <fieldset class="field-group">
      <legend class="field-label">Theme</legend>
      <div class="stack">
        <label class="choice">
          <input class="radio" type="radio" name="theme-detached" value="light" checked />
          <span>Light</span>
        </label>
        <label class="choice">
          <input class="radio" type="radio" name="theme-detached" value="dark" />
          <span>Dark</span>
        </label>
        <label class="choice">
          <input class="radio" type="radio" name="theme-detached" value="auto" />
          <span>System</span>
        </label>
      </div>
    </fieldset>

    <label class="choice">
      <input class="check" type="checkbox" />
      <span>Email notifications</span>
    </label>
  </div>
</form>

<footer class="form-actions sticky">
  <button type="button" class="btn outline">Cancel</button>
  <button type="submit" class="btn primary" form="account-form">
    Save changes
  </button>
</footer>
```

Knobs:

- `--z-sticky` — layering token, defaults to `10`.
- `--form-actions-sticky-padding` — inner padding, defaults to `--space-3`.
- `--form-actions-sticky-inline-offset` — full-bleed escape hatch for sticky actions inside padded containers. Set this on the page, not the form.

```css
.settings-page {
  --form-actions-sticky-inline-offset: var(--space-4);
}
```

A sticky footer can cover the last field on short pages. That is a page-layout concern, not a framework concern. Add bottom padding to the page or scroll container if needed.

## Choice Cards

> Card-style radio and checkbox labels where the whole card acts as a clickable target.

- Use `.choice-card` on a `<label>` wrapping a hidden native `<input type="radio">` or `<input type="checkbox">`.
- Selected items show a primary border, subtle background tint, and a checkmark badge at the top-right corner — round for radio, rounded square for checkbox.
- Pair with grid or flex utilities for group layout.
- Supports disabled, checked, and focus-visible states.

```html
<div class="grid-3">
  <label class="choice-card">
    <input type="radio" name="cpu" value="1" checked />
    <strong>8-core CPU</strong>
    <span class="muted">32 GB RAM</span>
  </label>
  <label class="choice-card">
    <input type="radio" name="cpu" value="2" />
    <strong>6-core CPU</strong>
    <span class="muted">24 GB RAM</span>
  </label>
  <label class="choice-card">
    <input type="radio" name="cpu" value="3" />
    <strong>4-core CPU</strong>
    <span class="muted">16 GB RAM</span>
  </label>
</div>
```

```html
<fieldset class="field-group">
  <legend class="field-label">Features</legend>
  <div class="grid-3">
    <label class="choice-card">
      <input type="checkbox" name="features" value="wifi" checked />
      <strong>WiFi</strong>
      <span class="muted">Dual-band 2.4/5 GHz</span>
    </label>
    <label class="choice-card">
      <input type="checkbox" name="features" value="bluetooth" />
      <strong>Bluetooth</strong>
      <span class="muted">5.3, low energy</span>
    </label>
    <label class="choice-card">
      <input type="checkbox" name="features" value="nfc" disabled />
      <strong>NFC</strong>
      <span class="muted">Coming soon</span>
    </label>
  </div>
</fieldset>
```

Sizes follow the shared `.sm` and `.lg` modifiers. Intent classes (`.primary`, `.secondary`) are supported on the `.choice-card` element.

## Switches

> Toggle controls that share a native checkbox at the markup level, with a switch visual.

- The API is `class="switch"`. Use `role="switch"` for ARIA correctness.
- The visual state tracks the native `checked` attribute. No JavaScript is required.
- For strict ARIA correctness, keep `aria-checked` in sync. This is an enhancement, not the baseline.

```html
<!-- Default: native state, no JS required. -->
<input class="switch" type="checkbox" role="switch" checked />
```

```html{.js}
<!-- Enhancement: keep aria-checked in sync. -->
<input class="switch"
       type="checkbox"
       role="switch"
       aria-checked="true"
       checked
       onchange="this.setAttribute('aria-checked', this.checked)" />
```

## Range

> Native range inputs with theme-aware accent color.

Core: native range, enhanced by `accent-color`. Optional richer skin may come later.

```html
<label class="field">
  <span class="field-label">Volume</span>
  <input class="range" type="range" min="0" max="100" value="50" />
</label>
```

## Validation

> Inline error feedback that respects assistive technology and form state.

- `.field-error` is the canonical error message. It is wired to `aria-invalid="true"` via the input, so the visual border and the assistive-tech announcement move together.
- `.field-help` is the canonical helper text. It carries supporting copy before and after validation.
- Set `aria-invalid="true"` on the input. The `.field-error` element is linked via `aria-describedby`.
- `role="alert"` on `.field-error` is only required when the message is inserted dynamically. Static messages do not need it.

```html
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

### Optional JavaScript enhancer

Native validation first; the enhancer only adds state and focus behavior.

Actual CSS ships validation *styles*. Invalid fields are marked with `aria-invalid="true"` (or the manual `.field.danger` wrapper class). The default forms bundle imports `forms/validation.css`; custom builds may omit that file when validation styling is app-owned. A small enhancer (`actual-css/js/validation`), included in the default runtime (`actual-css/js`) and also importable on its own, prevents premature error display, marks invalid fields on blur and submit, focuses the first invalid field on submit, and supports a few custom rules. It is not a validation framework — server and AJAX validation stay in app code.

Opt in with the `.needs-validation` class. Importing the module registers the behavior; there is no init call.

```html
<form class="needs-validation" data-validation-message="Please check the highlighted fields.">
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

```html
<form class="needs-validation" data-validation-message="Please check the highlighted fields.">
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

#### Built-in custom rules

Custom rules live in `data-validation-rules` as a comma-separated list; each rule may take space-separated options. The enhancer registers a few defaults:

- `same <selector>` — Value must equal the value of the element matched by `<selector>` (scoped to the field's form).
- `number` — Value is empty or a valid `Number`.
- `digits` — Value is empty or ASCII digits only.
- `alnum` — Value is empty or letters and digits only.
- `date` — Value is a valid date in `yyyy-mm-dd`, `dd/mm/yyyy`, `mm/dd/yyyy`, `dd.mm.yyyy`, `mm.dd.yyyy`, `dd-mm-yyyy`, or `mm-dd-yyyy` shape; rejects non-existent dates like `2026-02-29`. ISO remains the recommended wire format because servers can parse it without guessing.

Add your own with `FormValidator.registerRule(name, (value, el, ...opts) => boolean)`. The built-in rules treat empty values as valid so optional fields stay optional; custom rules should do the same when that behavior is wanted.

The `date` rule pairs naturally with `data-mask` — the mask structures input, the rule validates meaning. Same rule, different formats:

```html
<form class="stack needs-validation" novalidate>
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

#### Server and AJAX validation

The enhancer never makes network calls. After a valid client submit, your own `form[data-ajax]` flow (see [JavaScript](javascript.md)) performs the request and maps server errors back onto fields through the public API:

```js
import { FormValidator } from "actual-css/js/validation";

// server responded with field errors
FormValidator.setErrors(form, { email: "Already taken" });

// clear a single field once fixed
FormValidator.clearFieldError(form.elements.email);
```

`setErrors` resolves each name to a field, sets `aria-invalid`, the field's `.field-error` text, and `setCustomValidity` so the next submit stays blocked until corrected.
