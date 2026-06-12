# Forms

## Overview

> Cohesive set of form elements that share focus styles, helpers, and validation patterns.

- No floating labels
- Use progressive enhancement for modern select elements
- Proper focus style (preserve keyboard navigation)
- Use `label:has` for auto grouping
- Use flex utils for positioning

```html
<form class="form" novalidate>
  <div class="stack">

    <p class="section-title">Personal information</p>

    <!-- name — label wraps input, required -->
    <label>
      <span class="label-text">Full name <span class="required-mark" aria-hidden="true">*</span></span>
      <input type="text"
              autocomplete="name"
              required
              aria-required="true"
              placeholder="Jane Doe" />
    </label>

    <!-- email — with validation error state -->
    <label>
      <span class="label-text">Email address <span class="required-mark" aria-hidden="true">*</span></span>
      <input type="email"
              autocomplete="email"
              required
              aria-required="true"
              aria-invalid="true"
              aria-describedby="email-error"
              value="jane@" />
      <span class="error" id="email-error" role="alert">
        <i class="ti ti-alert-circle" aria-hidden="true"></i>
        Enter a valid email address
      </span>
    </label>

    <!-- website — optional, with hint -->
    <label>
      <span class="label-text">Website</span>
      <input type="url"
              autocomplete="url"
              aria-describedby="website-hint"
              placeholder="https://example.com" />
      <span class="hint" id="website-hint">Your public portfolio or personal site</span>
    </label>

    <!-- bio — textarea -->
    <label>
      <span class="label-text">Bio</span>
      <textarea aria-describedby="bio-hint"
                maxlength="200"
                placeholder="Tell us a bit about yourself…"></textarea>
      <span class="hint" id="bio-hint">Max 200 characters. Shown on your public profile.</span>
    </label>

    <hr class="divider" />
    <p class="section-title">Preferences</p>

    <!-- select — label wraps select -->
    <label>
      <span class="label-text">Language</span>
      <select autocomplete="language">
        <option value="">Choose a language</option>
        <option value="en" selected>English</option>
        <option value="fr">Français</option>
        <option value="nl">Nederlands</option>
        <option value="de">Deutsch</option>
      </select>
    </label>

    <!-- radio group — fieldset + legend -->
    <fieldset class="fieldset-clean">
      <legend class="label-text">Availability</legend>
      <div class="radio-group">
        <label>
          <input type="radio" name="availability" value="available" checked />
          Available for work
        </label>
        <label>
          <input type="radio" name="availability" value="open" />
          Open to opportunities
        </label>
        <label>
          <input type="radio" name="availability" value="unavailable" />
          Not available
        </label>
      </div>
    </fieldset>

    <!-- range with live value -->
    <label>
      <span class="label-text">Experience level</span>
      <div class="range-row">
        <input type="range"
                min="0"
                max="10"
                value="5"
                aria-valuetext="5 years"
                aria-describedby="range-hint"
                oninput="
                  this.setAttribute('aria-valuetext', this.value + ' years');
                  this.closest('label').querySelector('.range-value').textContent = this.value + ' yr';
                " />
        <span class="range-value" aria-hidden="true">5 yr</span>
      </div>
      <span class="hint" id="range-hint">Years of professional experience</span>
    </label>

    <hr class="divider" />
    <p class="section-title">Notifications</p>

    <!-- switch -->
    <label>
      <span class="switch-label-group">
        <span class="label-text">Email notifications</span>
        <span class="hint">Receive updates about your account activity</span>
      </span>
      <input type="checkbox"
              role="switch"
              aria-checked="true"
              checked
              onchange="this.setAttribute('aria-checked', this.checked)" />
    </label>

    <!-- checkbox -->
    <label>
      <input type="checkbox" />
      <span>
        I agree to the <a href="#">terms of service</a>
        <span class="hint" style="display:block">Required to create an account</span>
      </span>
    </label>

    <hr class="divider" />
    <p class="section-title">Account</p>

    <!-- file -->
    <label>
      <span class="label-text">Profile picture</span>
      <input type="file"
              accept="image/*"
              aria-describedby="file-hint" />
      <span class="hint" id="file-hint">JPG, PNG or WebP — max 2 MB</span>
    </label>

    <!-- disabled -->
    <label>
      <span class="label-text">Username</span>
      <input type="text"
              value="janedoe"
              disabled
              aria-describedby="username-hint" />
      <span class="hint" id="username-hint">Contact support to change your username</span>
    </label>

  </div>

  <div class="form-actions" style="margin-top: 2rem;">
    <button type="button" class="btn btn-outline">Cancel</button>
    <button type="submit" class="btn btn-primary">Save changes</button>
  </div>
</form>
```

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

## Validation

> Inline error and success feedback that respects assistive technology and form state.

Links:
- https://daisyui.com/components/validator/
- https://getbootstrap.com/docs/5.3/forms/validation/
