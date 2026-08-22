# Sticky Actions

> Use `.form-actions sticky` when long forms need reachable submit actions while scrolling.

## Inside the form

The `<form>` is the bounding parent. The sticky stays pinned to the viewport bottom while the form is taller than the viewport, then releases when the form's bottom edge reaches it.

Scroll the page to see the actions stay reachable.

```html demo
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
      <div class="stack sm">
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

## Detached from the form

For a sticky page footer, dialog footer, or card footer, detach the actions and connect the submit button with the `form` attribute. The bounding parent becomes the wrapper that holds both the form and the actions.

Scroll the page to see the detached footer stay reachable.

```html demo
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
      <div class="stack sm">
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

## CSS hooks

- `--z-sticky` — layering token, defaults to `10`.
- `--form-actions-sticky-padding` — inner padding, defaults to `--space-30`.
- `--form-actions-sticky-inline-offset` — full-bleed escape hatch for sticky actions inside padded containers. Set this on the page, not the form.

```css
.settings-page {
  --form-actions-sticky-inline-offset: var(--space-40);
}
```

A sticky footer can cover the last field on short pages. That is a page-layout concern, not a framework concern. Add bottom padding to the page or scroll container if needed.
