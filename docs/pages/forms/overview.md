# Forms

> Cohesive set of form elements that share focus styles, helpers, and validation patterns.

- Form controls are styled with explicit classes, not by parent scope.
- Control classes: `.input`, `.textarea`, `.select`, `.check`, `.radio`, `.switch`, `.range`, `.file`, `.color`.
- Reusable layout classes: `.field`, `.field-label`, `.field-help`, `.field-error`, `.field-group`, `.choice`, `.form-actions`, `.form-actions.sticky`.
- Floating labels available as optional CSS via `.floating-field` — standard `.field` labels remain the recommended default.
- Proper focus style that preserves keyboard navigation.
- `.field-group` and `.choice` provide layout without depending on parent scope.
- Customizable select is progressive enhancement only — the native select remains the baseline.

## Class reference

| Class           | Kind        | Description                                                                   |
|-----------------|-------------|-------------------------------------------------------------------------------|
| `.input`        | Component   | Text input; shares the text-control recipe with `.textarea` and `.select`.    |
| `.textarea`     | Component   | Multi-line text control.                                                      |
| `.select`       | Component   | Dropdown — native baseline with a CSS chevron and an opt-in enhanced picker.  |
| `.check`        | Component   | Styled checkbox.                                                              |
| `.radio`        | Component   | Styled radio button.                                                          |
| `.switch`       | Component   | Toggle switch on a checkbox input with `role="switch"`.                       |
| `.range`        | Component   | Native range slider with a theme-aware accent color.                          |
| `.file`         | Component   | Native file input with a themed picker button.                                |
| `.color`        | Component   | Native color picker in a control-sized box.                                   |
| `.field`        | Composition | Field wrapper that works on `<label>` and `<div>`.                            |
| `.field-label`  | Composition | Label text; element-agnostic — `<span>`, detached `<label>`, or `<legend>`.   |
| `.field-help`   | Composition | Supporting helper text under a control.                                       |
| `.field-error`  | Composition | Inline error message shown while the field is invalid.                        |
| `.field-group`  | Composition | Grouped `<fieldset>` container with a tunable legend gutter.                  |
| `.choice`       | Composition | Choice-label layout wrapping a `.check`, `.radio`, or `.switch`.              |
| `.form-actions` | Composition | Class-only flex row that closes a form; works inside or outside the `<form>`. |

## Example form

A full form using the control classes, field wrappers, and form actions:

```html demo
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

## Notes

- `required` is enough on native inputs. `aria-required="true"` is redundant and not used in these examples.
- `required` is the semantic source of truth. Add `<span class="required-mark" aria-hidden="true">*</span>` inside a label only when a visual required marker is wanted; the framework does not add one automatically.
- `.field` is the canonical field wrapper. It works on `<label>` and `<div>`.
- `.field-label` is element-agnostic. Use it on `<span>` inside a wrapped label, on `<label for="…">` in a detached layout, or on `<legend>` inside a fieldset.
- `.field-group` styles a `<fieldset class="field-group">` as a grouped field container. Its legend gutter is tunable with `--fieldset-legend-padding-inline` (`var(--space-10)`).
- Use native `<optgroup>` and `disabled` options in `.select` controls when applicable; the customizable picker preserves both as a progressive enhancement.
- `.choice` is the choice-label API. Use `.check` or `.radio` on the nested control. The control goes first, the label group second, so multi-line labels align the control with the first line.
- For a switch, use `class="switch"` and `role="switch"`.
- Core range controls stay native and are enhanced by `accent-color`. An optional richer range skin may come later if real projects need it.
- `.form-actions` carries a default top margin. Override it with `--form-actions-margin-block-start`, `--form-actions-align`, or `--form-actions-justify`. It is class-only and may live inside or outside `<form>`. See Detached Actions below.
- `.join` visually joins adjacent controls into a single unit. Use `.join-addon` for static prefix/suffix content. The container still carries `role="group"` for accessibility.

## Optional automatic required marks

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
