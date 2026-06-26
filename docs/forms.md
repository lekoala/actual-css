# Forms

## Overview

> Cohesive set of form elements that share focus styles, helpers, and validation patterns.

- Native form controls are styled automatically inside `.form`.
- Reusable classes for explicit composition: `.field`, `.field-label`, `.field-help`, `.field-error`, `.field-group`, `.choice`, `.form-actions`, `.form-actions.sticky`.
- No floating labels.
- Proper focus style that preserves keyboard navigation.
- Auto grouping via `label:has()` for checkbox and radio labels.
- Customizable select is progressive enhancement only — the native select remains the baseline.

```html
<form class="form" novalidate>
  <div class="stack">

    <label class="field">
      <span class="field-label">Full name <span class="required-mark" aria-hidden="true">*</span></span>
      <input type="text" autocomplete="name" required placeholder="Jane Doe" />
    </label>

    <label class="field">
      <span class="field-label">Email address <span class="required-mark" aria-hidden="true">*</span></span>
      <input type="email"
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
      <input type="url"
             autocomplete="url"
             aria-describedby="website-help"
             placeholder="https://example.com" />
      <span class="field-help" id="website-help">Your public portfolio or personal site</span>
    </label>

    <label class="field">
      <span class="field-label">Bio</span>
      <textarea aria-describedby="bio-help"
                maxlength="200"
                placeholder="Tell us a bit about yourself…"></textarea>
      <span class="field-help" id="bio-help">Max 200 characters. Shown on your public profile.</span>
    </label>

    <label class="field">
      <span class="field-label">Language</span>
      <select autocomplete="language">
        <option value="">Choose a language</option>
        <option value="en" selected>English</option>
        <option value="fr">Français</option>
        <option value="nl">Nederlands</option>
        <option value="de">Deutsch</option>
      </select>
    </label>

    <fieldset>
      <legend class="field-label">Availability</legend>
      <div class="stack">
        <label class="choice">
          <input type="radio" name="availability" value="available" checked />
          <span>Available for work</span>
        </label>
        <label class="choice">
          <input type="radio" name="availability" value="open" />
          <span>Open to opportunities</span>
        </label>
        <label class="choice">
          <input type="radio" name="availability" value="unavailable" />
          <span>Not available</span>
        </label>
      </div>
    </fieldset>

    <label class="field">
      <span class="field-label">Experience level</span>
      <input type="range"
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
      <input type="checkbox" />
      <span>
        I agree to the <a href="#">terms of service</a>
        <span class="field-help">Required to create an account</span>
      </span>
    </label>

    <label class="field">
      <span class="field-label">Profile picture</span>
      <input type="file" accept="image/*" aria-describedby="file-help" />
      <span class="field-help" id="file-help">JPG, PNG or WebP — max 2 MB</span>
    </label>

    <label class="field">
      <span class="field-label">Username</span>
      <input type="text"
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
- `.field` is the canonical field wrapper. It works on `<label>` and `<div>`. A plain `<label>` inside `.form` whose first control is a text input, textarea, or select is auto-styled for hand-authored HTML; prefer `.field` for generated markup or non-standard wrappers.
- `.field-label` is element-agnostic. Use it on `<span>` inside a wrapped label, on `<label for="…">` in a detached layout, or on `<legend>` inside a fieldset.
- `.field-group` styles a `<fieldset>` outside `.form`. Inside `.form`, a bare `<fieldset>` is also styled.
- `.choice` is the explicit choice-label API. A bare `<label>` whose first child is a checkbox or radio is auto-styled to match. The control goes first, the label group second, so multi-line labels align the control with the first line.
- For a switch, prefer `class="switch"` plus `role="switch"`. The class is the explicit API; the attribute is recognized as a fallback so both compose.
- `.form-actions` carries a default top margin. Override it with `--form-actions-margin-block-start`. It is class-only and may live inside or outside `<form>`. See Detached Actions below.

Links:
- https://oat.ink/components/#form
- https://picocss.com/docs/forms
- https://picocss.com/docs/group
- https://getbootstrap.com/docs/5.3/forms/overview/
- https://developer.chrome.com/blog/a-customizable-select
- https://modern-css.com/customizable-selects-without-a-javascript-library/
- https://smolcss.dev/#smol-focus-styles
- https://daisyui.com/components/checkbox/
- https://daisyui.com/components/fieldset/
- https://daisyui.com/components/label/
- https://daisyui.com/components/radio/
- https://daisyui.com/components/range/
- https://daisyui.com/components/select/
- https://daisyui.com/components/textarea/
- https://daisyui.com/components/toggle/
- https://uiterms.com/slider/
- https://uiterms.com/switch/
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/label

## States And Sizes

> Read-only, disabled, and shared size modifiers for form controls.

Use `readonly` for text-like values that can still be focused, selected, and submitted. Use `disabled` for unavailable controls that should not receive focus or submit a value.

The `.sm` and `.lg` modifiers set the shared control tokens used by inputs, selects, textareas, buttons, and switches. Put the modifier on the control itself, or on a `.field` wrapper when the whole field should share that size.

```html
<form class="form" novalidate>
  <fieldset>
    <legend class="field-label">Text control states</legend>
    <div class="stack grid-responsive">
      <div class="grid-3 items-start">
        <label class="field">
          <span class="field-label">Editable</span>
          <input type="text" value="Ocean Beach Clinic" />
        </label>

        <label class="field">
          <span class="field-label">Read-only</span>
          <input type="text" value="INV-2048" readonly />
          <span class="field-help">Focusable and submitted with the form.</span>
        </label>

        <label class="field">
          <span class="field-label">Disabled</span>
          <input type="text" value="Locked by billing" disabled />
          <span class="field-help">Unavailable and not submitted.</span>
        </label>
      </div>

      <div class="grid-3 items-start">
        <label class="field">
          <span class="field-label">Editable notes</span>
          <textarea>Patient asked for an invoice copy.</textarea>
        </label>

        <label class="field">
          <span class="field-label">Read-only notes</span>
          <textarea readonly>Insurance details imported from the patient record.</textarea>
        </label>

        <label class="field">
          <span class="field-label">Disabled notes</span>
          <textarea disabled>Notes are disabled until the transaction is selected.</textarea>
        </label>
      </div>
    </div>
  </fieldset>

  <fieldset>
    <legend class="field-label">Choice and select states</legend>
    <div class="stack grid-responsive">
      <div class="grid-3 items-start">
        <label class="field">
          <span class="field-label">Editable select</span>
          <select>
            <option>Card</option>
            <option>Bank transfer</option>
            <option>Cash</option>
          </select>
        </label>

        <label class="field">
          <span class="field-label">Invalid select</span>
          <select aria-invalid="true">
            <option>Choose a method</option>
            <option>Card</option>
            <option>Bank transfer</option>
          </select>
          <span class="field-error">Choose a payment method.</span>
        </label>

        <label class="field">
          <span class="field-label">Disabled select</span>
          <select disabled>
            <option>Card</option>
            <option>Bank transfer</option>
            <option>Cash</option>
          </select>
        </label>
      </div>

      <div class="grid-4 items-start">
        <label class="choice">
          <input type="checkbox" />
          <span>
            <span class="field-label">Unchecked checkbox</span>
            <span class="field-help">Available and not selected.</span>
          </span>
        </label>

        <label class="choice">
          <input type="checkbox" checked />
          <span>
            <span class="field-label">Checked checkbox</span>
            <span class="field-help">Available and selected.</span>
          </span>
        </label>

        <label class="choice">
          <input type="checkbox" checked disabled />
          <span>
            <span class="field-label">Disabled checked</span>
            <span class="field-help">Selected but unavailable.</span>
          </span>
        </label>

        <label class="choice">
          <input type="checkbox" disabled />
          <span>
            <span class="field-label">Disabled unchecked</span>
            <span class="field-help">Unavailable and not selected.</span>
          </span>
        </label>
      </div>

      <div class="grid-4 items-start">
        <label class="choice">
          <input type="radio" name="demo-radio-state" />
          <span>
            <span class="field-label">Unselected radio</span>
            <span class="field-help">Available and not selected.</span>
          </span>
        </label>

        <label class="choice">
          <input type="radio" name="demo-radio-state" checked />
          <span>
            <span class="field-label">Selected radio</span>
            <span class="field-help">Available and selected.</span>
          </span>
        </label>

        <label class="choice">
          <input type="radio" name="demo-radio-disabled" checked disabled />
          <span>
            <span class="field-label">Disabled selected</span>
            <span class="field-help">Selected but unavailable.</span>
          </span>
        </label>

        <label class="choice">
          <input type="radio" name="demo-radio-disabled" disabled />
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

  <fieldset>
    <legend class="field-label">Control sizes</legend>
    <div class="stack grid-responsive">
      <div class="grid-3 items-start">
        <label class="field sm">
          <span class="field-label">Small field</span>
          <input type="text" value="sm" />
        </label>

        <label class="field">
          <span class="field-label">Default field</span>
          <input type="text" value="default" />
        </label>

        <label class="field lg">
          <span class="field-label">Large field</span>
          <input type="text" value="lg" />
        </label>
      </div>

      <div class="grid-3 items-start">
        <label class="field sm">
          <span class="field-label">Small select</span>
          <select>
            <option>Compact</option>
          </select>
        </label>

        <label class="field">
          <span class="field-label">Default select</span>
          <select>
            <option>Default</option>
          </select>
        </label>

        <label class="field lg">
          <span class="field-label">Large select</span>
          <select>
            <option>Comfortable</option>
          </select>
        </label>
      </div>

      <div class="grid-3 items-start">
        <label class="field sm">
          <span class="field-label">Small textarea</span>
          <textarea rows="2">Short note</textarea>
        </label>

        <label class="field">
          <span class="field-label">Default textarea</span>
          <textarea rows="2">Default note</textarea>
        </label>

        <label class="field lg">
          <span class="field-label">Large textarea</span>
          <textarea rows="2">Comfortable note</textarea>
        </label>
      </div>

      <div class="grid-3 items-start">
        <button class="btn outline sm" type="button">Small</button>
        <button class="btn outline" type="button">Default</button>
        <button class="btn outline lg" type="button">Large</button>
      </div>

      <div class="grid-3 items-start">
        <label class="choice sm">
          <input type="checkbox" checked />
          <span>Small checkbox</span>
        </label>
        <label class="choice">
          <input type="checkbox" checked />
          <span>Default checkbox</span>
        </label>
        <label class="choice lg">
          <input type="checkbox" checked />
          <span>Large checkbox</span>
        </label>
      </div>

      <div class="grid-3 items-start">
        <label class="choice sm">
          <input type="radio" name="demo-radio-size" checked />
          <span>Small radio</span>
        </label>
        <label class="choice">
          <input type="radio" name="demo-radio-size" />
          <span>Default radio</span>
        </label>
        <label class="choice lg">
          <input type="radio" name="demo-radio-size" />
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
  <input type="text" name="name" autocomplete="name" />
</label>
```

Use **`for`/`id`** when the layout needs the label and control in different grid areas, when the markup is generated by a backend or form library, or when a single label is paired with multiple controls. `.field-label` is element-agnostic, so it works on a detached `<label>`.

```html
<div class="field">
  <label class="field-label" for="profile-email">
    Email address <span class="required-mark" aria-hidden="true">*</span>
  </label>
  <input id="profile-email"
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

Links:
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/label

## Detached Actions

> `.form-actions` is class-only. It may live inside or outside the `<form>`. Use the native `form` attribute to connect a detached submit button to its form.

The simplest case stays inside the form.

```html
<form class="form" novalidate>
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
<form id="profile-form" class="form" novalidate>
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
      class="form"
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
<form class="form" novalidate>
  <div class="stack">
    <label class="field">
      <span class="field-label">Full name <span class="required-mark" aria-hidden="true">*</span></span>
      <input type="text" autocomplete="name" required placeholder="Jane Doe" />
    </label>

    <label class="field">
      <span class="field-label">Email <span class="required-mark" aria-hidden="true">*</span></span>
      <input type="email" autocomplete="email" required />
    </label>

    <label class="field">
      <span class="field-label">Phone</span>
      <input type="tel" autocomplete="tel" />
    </label>

    <label class="field">
      <span class="field-label">Bio</span>
      <textarea rows="4" placeholder="Tell us about yourself…"></textarea>
    </label>

    <label class="field">
      <span class="field-label">Website</span>
      <input type="url" autocomplete="url" placeholder="https://example.com" />
    </label>

    <label class="field">
      <span class="field-label">Language</span>
      <select>
        <option>English</option>
        <option>Français</option>
        <option>Deutsch</option>
      </select>
    </label>

    <label class="field">
      <span class="field-label">Experience level</span>
      <input type="range" min="0" max="10" value="5" />
    </label>

    <label class="field">
      <span class="field-label">Profile picture</span>
      <input type="file" accept="image/*" />
    </label>

    <fieldset>
      <legend class="field-label">Theme</legend>
      <div class="stack">
        <label class="choice">
          <input type="radio" name="theme" value="light" checked />
          <span>Light</span>
        </label>
        <label class="choice">
          <input type="radio" name="theme" value="dark" />
          <span>Dark</span>
        </label>
        <label class="choice">
          <input type="radio" name="theme" value="auto" />
          <span>System</span>
        </label>
      </div>
    </fieldset>

    <label class="choice">
      <input type="checkbox" />
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
<form id="account-form" class="form" novalidate>
  <div class="stack">
    <label class="field">
      <span class="field-label">Full name <span class="required-mark" aria-hidden="true">*</span></span>
      <input type="text" autocomplete="name" required placeholder="Jane Doe" />
    </label>

    <label class="field">
      <span class="field-label">Email <span class="required-mark" aria-hidden="true">*</span></span>
      <input type="email" autocomplete="email" required />
    </label>

    <label class="field">
      <span class="field-label">Phone</span>
      <input type="tel" autocomplete="tel" />
    </label>

    <label class="field">
      <span class="field-label">Bio</span>
      <textarea rows="4" placeholder="Tell us about yourself…"></textarea>
    </label>

    <label class="field">
      <span class="field-label">Website</span>
      <input type="url" autocomplete="url" placeholder="https://example.com" />
    </label>

    <label class="field">
      <span class="field-label">Language</span>
      <select>
        <option>English</option>
        <option>Français</option>
        <option>Deutsch</option>
      </select>
    </label>

    <label class="field">
      <span class="field-label">Experience level</span>
      <input type="range" min="0" max="10" value="5" />
    </label>

    <label class="field">
      <span class="field-label">Profile picture</span>
      <input type="file" accept="image/*" />
    </label>

    <fieldset>
      <legend class="field-label">Theme</legend>
      <div class="stack">
        <label class="choice">
          <input type="radio" name="theme-detached" value="light" checked />
          <span>Light</span>
        </label>
        <label class="choice">
          <input type="radio" name="theme-detached" value="dark" />
          <span>Dark</span>
        </label>
        <label class="choice">
          <input type="radio" name="theme-detached" value="auto" />
          <span>System</span>
        </label>
      </div>
    </fieldset>

    <label class="choice">
      <input type="checkbox" />
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

## Switches

> Toggle controls that share a native checkbox at the markup level, with a switch visual.

- The explicit API is `class="switch"`. Adding `role="switch"` is the no-class fallback and the two compose.
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

## Validation

> Inline error and success feedback that respects assistive technology and form state.

- `.field-error` is the canonical error message. It is wired to `aria-invalid="true"` via the input, so the visual border and the assistive-tech announcement move together.
- `.field-help` is the canonical helper text. It carries the description whether the field is in a danger or a success state.
- Set `aria-invalid="true"` on the input. The `.field-error` element is linked via `aria-describedby`.
- `role="alert"` on `.field-error` is only required when the message is inserted dynamically. Static messages do not need it.

```html
<form class="form" novalidate>
  <div class="stack">
    <label class="field">
      <span class="field-label">Email</span>
      <input type="email"
             value="jane@"
             aria-invalid="true"
             aria-describedby="email-error" />
      <span class="field-error" id="email-error" role="alert">
        Enter a valid email address
      </span>
    </label>

    <label class="field">
      <span class="field-label">Username</span>
      <input type="text" value="janedoe" aria-describedby="username-help" />
      <span class="field-help" id="username-help">
        Username is available.
      </span>
    </label>
  </div>
</form>
```

Links:
- https://daisyui.com/components/validator/
- https://getbootstrap.com/docs/5.3/forms/validation/
- https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/switch_role
