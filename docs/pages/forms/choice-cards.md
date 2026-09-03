# Choice Cards

> Card-style radio and checkbox labels where the whole card acts as a clickable target.

## Class reference

| Class                     | Kind      | Description                                   |
| ------------------------- | --------- | --------------------------------------------- |
| `.choice-card`            | Component | Card-style `<label>` around a native control. |
| `.primary` / `.secondary` | Intent    | Accent for the selected state.                |

- Use `.choice-card` on a `<label>` wrapping a native `<input type="radio">` or `<input type="checkbox">`. The input is visually hidden; in browsers without `:has()` it stays visible so selection state never disappears.
- Selected items show a primary border, subtle background tint, and a checkmark badge at the top-right corner — round for radio, rounded square for checkbox.
- Pair with grid or flex utilities for group layout. The badge overhangs the top-right corner, so avoid `overflow: hidden` on the direct container.
- Supports disabled, checked, focus-visible, and invalid states.

```html demo
<div class="grid-3">
  <label class="choice-card">
    <input type="radio" name="cpu" value="1" checked />
    <strong>8-core CPU</strong>
    <span class="muted">32 GB RAM</span>
  </label>
  <label class="choice-card">
    <input type="radio" name="cpu" value="2" />
    <strong>6-core CPU</strong>
    <span class="muted">24 GB RAM</span>
  </label>
  <label class="choice-card">
    <input type="radio" name="cpu" value="3" />
    <strong>4-core CPU</strong>
    <span class="muted">16 GB RAM</span>
  </label>
</div>
```

```html demo
<fieldset class="field-group">
  <legend class="field-label">Features</legend>
  <div class="grid-3">
    <label class="choice-card">
      <input type="checkbox" name="features" value="wifi" checked />
      <strong>WiFi</strong>
      <span class="muted">Dual-band 2.4/5 GHz</span>
    </label>
    <label class="choice-card">
      <input type="checkbox" name="features" value="bluetooth" />
      <strong>Bluetooth</strong>
      <span class="muted">5.3, low energy</span>
    </label>
    <label class="choice-card">
      <input type="checkbox" name="features" value="nfc" disabled />
      <strong>NFC</strong>
      <span class="muted">Coming soon</span>
    </label>
  </div>
</fieldset>
```

Validation follows the shared pattern: `aria-invalid="true"` on the input (set manually or by the `.needs-validation` enhancer) turns the card border to danger, and a `.field-error` inside a `.field` wrapper is shown.

```html demo
<fieldset class="field field-group">
  <legend class="field-label">Plan</legend>
  <div class="grid-3">
    <label class="choice-card">
      <input type="radio" name="plan" value="starter"
             aria-invalid="true" aria-describedby="plan-error" />
      <strong>Starter</strong>
      <span class="muted">1 project</span>
    </label>
    <label class="choice-card">
      <input type="radio" name="plan" value="pro"
             aria-invalid="true" aria-describedby="plan-error" />
      <strong>Pro</strong>
      <span class="muted">Unlimited projects</span>
    </label>
    <label class="choice-card">
      <input type="radio" name="plan" value="team"
             aria-invalid="true" aria-describedby="plan-error" />
      <strong>Team</strong>
      <span class="muted">Unlimited + SSO</span>
    </label>
  </div>
  <span class="field-error" id="plan-error" role="alert">
    Choose a plan to continue.
  </span>
</fieldset>
```

Sizes follow the shared `.sm` and `.lg` modifiers. Intent classes (`.primary`, `.secondary`) are supported on the `.choice-card` element.

## CSS hooks

- `--choice-card-pad` — inner padding.
- `--choice-card-radius` — corner radius.
- `--choice-card-check-size` — size of the check indicator.

Plain `.check` / `.radio` controls expose two hooks:

- `--choice-control-size` — the control's own size, in `em` off the surrounding
  type. The switch track derives from it too, so a checkbox and a switch on the
  same line stay proportionate. `.sm` / `.lg` do not touch it.
- `--choice-control-offset` — top offset that aligns the control with the first
  line of a multi-line label. Left unset, each control derives its own offset
  from its height and the line box, which keeps a checkbox and a taller switch
  level with each other. Setting one constant applies it to both.
