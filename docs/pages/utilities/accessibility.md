# Accessibility

Text hidden visually but still available to assistive technology.

**Related terms:** visually hidden, screen-reader text, hide label on mobile,
icon-only on small screens.

## Class reference

| Class      | Kind    | Description                                                     |
| ---------- | ------- | --------------------------------------------------------------- |
| `.sr-only` | Utility | Visually hides text while keeping it in the accessibility tree. |

## Screen reader only

Use `.sr-only` for text that should be available to assistive technology but visually hidden.

```html demo
<button class="btn ghost" type="button">
  <i class="ti ti-menu-2" aria-hidden="true"></i>
  <span class="sr-only">Open navigation</span>
</button>
```

### Hidden on narrow screens only

A toolbar label that shows beside its icon on wide screens and stays only as
the accessible name on narrow ones. `.sr-only` has no responsive variant:
repeat its declarations in your own query. Never use `display: none`, which
removes the name too.

```css
@media (width < 48rem) {
  .toolbar-label {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }
}
```

```html
<button class="btn ghost" type="button">
  <i class="ti ti-download" aria-hidden="true"></i>
  <span class="toolbar-label">Export</span>
</button>
```

The hidden text is positioned absolutely, so give it a positioned ancestor
inside any scroll container, as `.table-wrap` does.

## Touch targets

`.touch-target` adds 8px of invisible hit area around a small control on coarse
primary pointers, without growing the visual. Apply it opt-in to targets that
are genuinely small — icon buttons, close buttons, compact actions.

```html demo
<button class="btn icon-only touch-target" type="button" aria-label="Close">
  <i class="ti ti-x" aria-hidden="true"></i>
</button>
```

**Related terms:** touch target, hit area, tap target, target size.

On fine pointers the class is fully neutral. On coarse pointers it establishes
a relative positioning context — do not apply it to controls whose positioning
is structural (`fixed`, `absolute`, `sticky`).
