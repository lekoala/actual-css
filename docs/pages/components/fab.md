# Floating action button

> **Optional** — import `actual-css/css/optional/fab` or `actual-css/css/optional/index`.

FAB fixes a primary action near the viewport's block-end and inline-end edges.
The existing button component owns its size, shape, intent, and interaction.

```html
<div class="fab">
  <button class="btn circle primary lg icon-only" type="button" aria-label="Create">
    <span aria-hidden="true">+</span>
  </button>
</div>
```

Use native `details` for a no-JavaScript speed dial. List actions in their
visual top-to-bottom order so keyboard focus follows the same sequence.

```html
<details class="fab">
  <summary class="btn circle primary lg icon-only" aria-label="Create">
    <span aria-hidden="true">+</span>
  </summary>

  <div class="fab-actions">
    <button class="btn circle lg icon-only" type="button" aria-label="New document">…</button>
    <button class="btn circle lg icon-only" type="button" aria-label="Upload file">…</button>
    <button class="btn circle lg icon-only" type="button" aria-label="New folder">…</button>
  </div>
</details>
```

The native baseline manages click, keyboard activation, and the open state. It
does not close automatically after an action, on outside click, or on Escape;
add application behavior only when the product requires those policies.

For labeled actions, compose each button and label with `.cluster` inside
`.fab-actions`. FAB deliberately does not provide an action-label component.

## CSS hooks

- `--fab-offset` — minimum viewport-edge offset.
- `--fab-gap` — gap between actions and between the trigger and action list.

FAB is hidden in print and uses `--z-menu`, leaving tooltips and status UI above
it. Dialogs remain in the browser's top layer.
