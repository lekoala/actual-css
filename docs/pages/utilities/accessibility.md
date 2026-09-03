# Accessibility

Text hidden visually but still available to assistive technology.

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

```css
.sr-only {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

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
