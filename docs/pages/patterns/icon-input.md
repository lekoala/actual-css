# Icon Input

Use `.input-icon` for a search or filter input with a leading icon.

```html demo
<label class="input-icon">
  <i class="ti ti-search" aria-hidden="true"></i>
  <input class="input" type="search" placeholder="Search accounts, invoices, notes" aria-label="Search">
</label>
```

It positions the wrapper's first child absolutely inside a relative container and grows the input's start padding to clear it. `pointer-events: none` on the icon keeps clicks passing through to the input underneath. It is icon-library agnostic — an `<i>` webfont icon, an inline `<svg>`, or a `<span>` all work as the wrapper's first child.

The icon keeps a fixed `--input-icon-size` (1.25rem); density contexts shrink the control geometry around it, not the pictogram. Apply the density class to the wrapper and to the input so the control height follows:

```html demo
<div class="stack">
  <label class="input-icon sm">
    <i class="ti ti-search" aria-hidden="true"></i>
    <input class="input sm" type="search" aria-label="Search">
  </label>
</div>
```

Trailing icons are supported too: an icon that follows the input is positioned at the end and the input grows its end padding. It stays decorative — `pointer-events: none` means an interactive trailing control such as a clear button is not covered by this class.
