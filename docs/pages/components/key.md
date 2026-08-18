# Key

> Keyboard keys and shortcut tokens for app UI, command palettes, menus, and help text.

- Use `<kbd class="key">` outside prose.
- Plain `<kbd>` inside `.prose` gets the same visual treatment for authored content.
- `.shortcut` is a documented composition, not a component class. Compose multiple `.key` elements with text or layout utilities.
- Use short, familiar labels such as `Ctrl`, `Shift`, `Esc`, or `K`.

## Basic usage

```html demo
<p>Press <kbd class="key">Esc</kbd> to close the panel.</p>

<div class="cluster" aria-label="Keyboard shortcut Control K">
  <kbd class="key">Ctrl</kbd>
  <kbd class="key">K</kbd>
</div>
```

## In menus

In menus, keep the command label and shortcut in the same interactive item.

```html demo
<button type="button">
  <span>Search</span>
  <span class="cluster" aria-label="Keyboard shortcut Control K">
    <kbd class="key">Ctrl</kbd>
    <kbd class="key">K</kbd>
  </span>
</button>
```
