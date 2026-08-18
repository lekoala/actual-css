# Detached Actions

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