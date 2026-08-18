# Tooltip

> Supplemental label for a trigger, shown on hover and focus, hidden on dismissal.

Tooltips are supplemental: `data-tooltip` on the trigger wires a `.tooltip`
element (`role="tooltip"`) that appears near the trigger. Position, placement,
and arrow position are written by JavaScript; the element is shown and hidden
with the `hidden` attribute.

- Use `data-tooltip` on the trigger. With text (`data-tooltip="Help"`), the tooltip element is generated. Empty (`data-tooltip`) marks an explicit tooltip connected via `aria-describedby`.
- Tooltips are supplemental. Do not put required information or interactive controls inside them.
- Show on hover and focus. Hide on Escape, blur, pointer leave, or scroll when appropriate.
- JavaScript can generate tooltip elements from `data-tooltip`.
- Add `data-tooltip-click` to toggle it on click instead of hover/focus.
- Add `data-tooltip-visible` to show it immediately and keep it visible while its trigger is in view.
- Use `data-tooltip-placement` to set the preferred placement (default `top`).
- The arrow inherits the tooltip background — custom gradients carry through automatically.
- Avoid relying on the native `title` attribute as the primary implementation.

```html demo
<button class="btn ghost"
        type="button"
        data-tooltip
        aria-describedby="tooltip-save"
        aria-label="Save">
  <i class="ti ti-device-floppy" aria-hidden="true"></i>
</button>

<div class="tooltip" role="tooltip" id="tooltip-save" hidden>
  Save changes
</div>
```

```html demo
<button class="btn" type="button" data-tooltip="Save changes">
  Save
</button>
```

## Display modes

Click tooltips stay open when the pointer leaves and close on a second click or
Escape. They remain supplemental, non-interactive content; use a flyout when the
floating content contains controls.

```html demo
<p class="cluster">
  <button class="btn outline" type="button"
          data-tooltip="Click again or press Escape to close"
          data-tooltip-click>
    Toggle on click
  </button>

  <button class="btn outline" type="button"
          data-tooltip="Always visible while this trigger is in view"
          data-tooltip-visible
          data-tooltip-placement="bottom">
    Always visible
  </button>
</p>
```

## HTML and long content

The `data-tooltip="…"` shorthand is intentionally plain text. For trusted HTML,
use an explicit tooltip referenced by `aria-describedby`. Keep its content
non-interactive and concise; long content wraps up to the tooltip's
viewport-aware maximum width.

```html demo
<button class="btn" type="button"
        data-tooltip
        aria-describedby="tip-rich-long"
        data-tooltip-placement="bottom">
  Long HTML tooltip
</button>

<div class="tooltip" role="tooltip" id="tip-rich-long" hidden>
  <strong>Keyboard shortcut:</strong> press <kbd>Ctrl</kbd> + <kbd>K</kbd> to open search.
  This longer explanation demonstrates wrapping when a supplemental label needs a little more context.
</div>
```

## Positioning

Set `data-tooltip-placement` to control where the tooltip appears relative to
its trigger. The arrow follows the placement automatically.

```html demo
<p>
  <button class="btn outline" type="button" data-tooltip="Above the button" data-tooltip-placement="top">Top</button>
  <button class="btn outline" type="button" data-tooltip="To the right" data-tooltip-placement="right">Right</button>
  <button class="btn outline" type="button" data-tooltip="Below the button" data-tooltip-placement="bottom">Bottom</button>
  <button class="btn outline" type="button" data-tooltip="To the left" data-tooltip-placement="left">Left</button>
</p>
```

## Custom styling

Override `--tooltip-bg` and `--tooltip-fg` on the tooltip element to change the
background and text color. The arrow picks up `background: inherit` so gradients
and solid colors both work.

```html demo
<button class="btn primary" type="button"
        data-tooltip
        aria-describedby="tip-grad"
        data-tooltip-placement="right">
  Hover for gradient
</button>

<div class="tooltip" role="tooltip" id="tip-grad" hidden
     style="background-color: #5b2d9e;
            --tooltip-bg: linear-gradient(135deg, oklch(0.45 0.22 280), oklch(0.5 0.2 10));
            --tooltip-fg: white;
            padding: 0.4em 0.8em;
            font-weight: var(--font-weight-medium);">
  <strong>Custom gradient tooltip:</strong> the arrow matches the background, and this longer
  sentence demonstrates how the tooltip wraps and flips when the preferred side lacks space.
</div>
```

## CSS hooks

- `--tooltip-bg` — bubble background (defaults to `var(--surface-solid)`); the arrow follows it.
- `--tooltip-fg` — text color.
- `--tooltip-arrow-size` — arrow size.

`--arrow-x` and `--arrow-y` are written by the positioner at runtime, not set by
the author. See the JavaScript runtime documentation.