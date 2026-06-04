# Dropdown

Toggle menu for secondary actions.

## Basic dropdown

Dropdown with details element.

```html
<div class="dropdown">
  <details>
    <summary class="btn neutral outline">Actions</summary>
    <menu class="dropdown-menu">
      <button class="btn neutral link" type="button">Edit</button>
      <button class="btn neutral link" type="button">Delete</button>
    </menu>
  </details>
</div>
```

## Inside a join

Split button with dropdown.

```html
<div class="join">
  <button class="btn primary" type="button">Save</button>
  <details class="dropdown">
    <summary class="btn primary outline" aria-label="More actions">More</summary>
    <menu class="dropdown-menu">
      <button class="btn neutral link" type="button">Save draft</button>
    </menu>
  </details>
</div>
```

## Accessibility

- Use aria-label for the toggle trigger.
- Use <menu> for dropdown lists.
