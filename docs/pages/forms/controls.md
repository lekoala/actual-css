# Controls

Native-only control chrome: the file input and color picker mostly defeat custom styling, so the framework stays out of the way and keeps them readable and theme-aware.

## Color

> Small, theme-aware chrome for the native color picker.

Use `.color` on an `input[type="color"]` to give the native picker a control-sized
box with the framework's border, radius, surface, disabled, and focus styles.
The color dialog and selected-color swatch remain browser-native.

```html demo
<label class="field">
  <span class="field-label">Accent color</span>
  <input class="color" type="color" value="#6d5dfc" />
</label>
```

## File

Use `.file` on an `input[type="file"]` to keep the field native while theming the
picker button with the framework's surface, border, radius, and hover states.
The filename area stays muted.

```html demo
<label class="field">
  <span class="field-label">Profile picture</span>
  <input class="file" type="file" accept="image/*" aria-describedby="file-help" />
  <span class="field-help" id="file-help">JPG, PNG or WebP — max 2 MB</span>
</label>
```