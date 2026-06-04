# Dialog

Modal dialog.

## Default

Default dialog.

```html .center
<dialog class="dialog" id="confirm" open>
  <form method="dialog" class="stack">
    <h2>Confirm</h2>
    <p>Are you sure?</p>
    <div class="cluster">
      <button class="btn neutral outline" value="cancel">Cancel</button>
      <button class="btn danger" value="delete">Delete</button>
    </div>
  </form>
</dialog>
```

## Accessibility

- Use `<dialog>` with `method="dialog"` for accessible modals.
