# Close

> Icon-only X button that closes a dialog, dismisses an alert, or removes a tag.

**Related terms:** close button, dismiss button, remove button, clear, X.

- Use an empty `<button class="close" aria-label="…">`: it paints its own X from `--icon-close`, so it needs no icon font and no text glyph.
- `.close` is always the X. A button with another pictogram is a `.btn.icon-only`.
- The class names the look, not the mechanism. Close with the container's own action: `command="request-close"` or `method="dialog"` in a dialog, `command="--dismiss"` on an alert, application logic on a tag.
- The container sets the size and place: the top inline-end corner of a `.modal` or a `.drawer`, the last column of an `.alert`, the end of a `.badge`.
- A modular build imports `actual-css/css/components/close` next to the component that hosts it.

## Basic usage

```html demo
<div class="cluster">
  <button class="close" type="button" aria-label="Close"></button>

  <span class="badge primary soft">
    Design
    <button class="close" type="button" aria-label="Remove Design"></button>
  </span>
</div>
```

## In a dialog

In a `.modal` or a `.drawer`, the close sits out of the content flow at the
panel's top inline-end corner. Place it as a direct child of the dialog, of its
top-level `form` or `header`, or of a `form` inside that header; a `.close`
deeper in the content keeps its own place. See [Dialog](dialog.md) and
[Drawer](drawer.md).

```html
<dialog class="modal" id="details">
  <button class="close" type="button" commandfor="details" command="request-close"
          aria-label="Close dialog"></button>
  …
</dialog>
```

## CSS hooks

- `--close-size` — inline and block size of the button; `--control-size` unless the container sets it.
- `--close-icon-size` — size of the X.

Alerts and badges declare both hooks on themselves, so set them on the container
or on the button.
