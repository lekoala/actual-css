# Forms

Form inputs, labels, and controls.

## Text input

Basic text input with label.

```html .list
<label class="field">
  <span class="label">Email</span>
  <input class="input" type="email" placeholder="you@example.com">
  <span class="help">We will never share your email.</span>
</label>
```

## Textarea

Multi-line text input.

```html .list
<label class="field">
  <span class="label">Bio</span>
  <textarea class="textarea">Default text</textarea>
</label>
```

## Select

Dropdown select input.

```html .list
<label class="field">
  <span class="label">Role</span>
  <select class="select">
    <option>Admin</option>
    <option>Editor</option>
  </select>
</label>
```

## Checkbox

Checkbox inputs with choice wrapper.

```html .list
<label class="choice">
  <input class="check" type="checkbox" checked>
  Product updates
</label>
```

## Radio

Radio button inputs.

```html .list
<label class="choice">
  <input class="radio" name="plan" type="radio">
  Pro
</label>
```

## Switch

Toggle switch.

```html .list
<label class="choice">
  <input class="switch" type="checkbox" checked>
  Enable notifications
</label>
```

## Fieldset

Grouped form fields.

```html .list
<fieldset class="field">
  <legend class="label">Preferences</legend>
  <label class="choice">
    <input class="check" type="checkbox">
    Option A
  </label>
</fieldset>
```

## Error state

Field with validation error.

```html .list
<label class="field danger">
  <span class="label">Email</span>
  <input class="input" type="email" aria-invalid="true">
  <span class="help">Enter a valid email address.</span>
</label>
```

## Field sizes

```html .list
<input class="input sm" type="text" placeholder="Small">
<input class="input" type="text" placeholder="Default">
<input class="input lg" type="text" placeholder="Large">
```

## Accessibility

- Use <label> elements with proper for/id attributes.
- Use aria-invalid for validation errors.
- Use fieldset and legend for grouped controls.
