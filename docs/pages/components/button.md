# Button

Actions and navigation with shared intents, variants, sizes, and loading, pressed, and disabled states.

## Class reference

| Class         | Kind      | Description                                                                                |
|---------------|-----------|--------------------------------------------------------------------------------------------|
| `.btn`        | Component | Base button. Solid by default; works on `<button>`, `<a href>`, and button-like `<input>`. |
| `.primary`    | Intent    | Primary action.                                                                            |
| `.secondary`  | Intent    | Secondary action.                                                                          |
| `.success`    | Intent    | Positive outcome.                                                                          |
| `.warning`    | Intent    | Caution.                                                                                   |
| `.danger`     | Intent    | Destructive action.                                                                        |
| `.neutral`    | Intent    | Neutral tone (the `.btn` default).                                                         |
| `.soft`       | Variant   | Muted intent-tinted surface.                                                               |
| `.outline`    | Variant   | Transparent with an intent-colored border.                                                 |
| `.solid`      | Variant   | Filled intent background — the `.btn` default.                                             |
| `.ghost`      | Variant   | Borderless text button (button-only).                                                      |
| `.link`       | Variant   | Underlined text button (button-only).                                                      |
| `.sm` / `.lg` | Size      | Compact or large control height.                                                           |
| `.icon-only`  | Variant   | Square icon button sized to the control height.                                            |

## Basic usage

Use `.btn` on actionable elements: `<button>`, `<a href>`, or
`input[type="button"|"submit"|"reset"]`. Use a real `<button>` for actions and
`<a class="btn">` for navigation.

```html demo
<div class="cluster">
  <button class="btn" type="button">Default</button>
  <button class="btn primary" type="button">Primary</button>
  <a class="btn primary" href="#">Account</a>
  <input class="btn" type="button" value="Input button" />
</div>
```

## Intents

Shared intent classes set color meaning. They compose with every variant.

```html demo
<div class="cluster">
  <button class="btn primary" type="button">Primary</button>
  <button class="btn secondary" type="button">Secondary</button>
  <button class="btn success" type="button">Success</button>
  <button class="btn warning" type="button">Warning</button>
  <button class="btn danger" type="button">Danger</button>
  <button class="btn neutral" type="button">Neutral</button>
</div>
```

## Variants

`.ghost` and `.link` are button-only; `.soft`, `.outline`, and `.solid` are
shared with other components.

Transparent treatments (`.outline`, `.ghost`, `.link`) follow the surrounding
foreground by default, including on a contrasting `.inverted` surface. A local
intent class still wins: `.danger.outline` uses the danger color in either
context. Filled buttons own their surface and keep their normal intent recipe.

`.btn.link` is a link-style action: it keeps button behavior and states, but
remains intrinsically sized like text instead of stretching with its layout
container. For a plain text link, use a bare `<a>` with no class.

```html demo
<div class="cluster">
  <a href="#">Normal link</a>
  <a class="btn link" href="#">Button-like link</a>
  <button class="btn link" type="button">Button with link appearance</button>
</div>
```

```html demo
<div class="cluster">
  <button class="btn outline" type="button">Outline</button>
  <button class="btn danger outline" type="button">Danger outline</button>
  <button class="btn soft" type="button">Soft</button>
  <button class="btn danger soft" type="button">Danger soft</button>
  <button class="btn ghost" type="button">Ghost</button>
  <button class="btn link" type="button">Button as link</button>
</div>
```

### Icon and icon-only buttons

```html demo
<div class="cluster">
  <button class="btn" type="button"><i class="ti ti-star" aria-hidden="true"></i> With an icon</button>
  <button class="btn icon-only" type="button" aria-label="Add">
    <i class="ti ti-plus" aria-hidden="true"></i>
  </button>
  <button class="btn primary icon-only" type="button" aria-label="Search">
    <i class="ti ti-search" aria-hidden="true"></i>
  </button>
</div>
```

Use `.btn.icon-only` for a square icon button sized to the control height.
Always name it with an `aria-label` since there is no visible text.

### Button groups

Join adjacent buttons with `.join`. The joined group is not a new component —
the buttons keep their own variants.

```html demo
<div class="join" role="group" aria-label="Text alignment">
  <button class="btn" type="button">Left</button>
  <button class="btn outline" type="button">Center</button>
  <button class="btn soft" type="button">Right</button>
</div>
```

## Sizes

Prefer `.sm` and `.lg` over setting sizes directly. Density variants never
change typography.

```html demo
<div class="cluster">
  <button class="btn sm" type="button">Small</button>
  <button class="btn" type="button">Regular</button>
  <button class="btn lg" type="button">Large</button>
</div>
```

## States

### Compact filters and actions

A compact filter is still a button, not a separate chip semantic. Compose the
small size with `aria-pressed`; application code owns the state change.

```html demo
<div class="cluster" aria-label="Task filters">
  <button class="btn sm" type="button" aria-pressed="true">All</button>
  <button class="btn sm outline" type="button" aria-pressed="false">Open</button>
  <button class="btn sm outline" type="button" aria-pressed="false">Done</button>
</div>
```

Use `.badge` for a passive category or count and the removable-tag composition
when a displayed value needs its own remove action. Actual intentionally has no
generic `.chip` component: action, selection, and information retain their HTML
semantics.

### Disabled

Disable a `<button>` or `<input>` with the native `disabled` attribute. Anchors
have no native disabled state, so `<a class="btn" aria-disabled="true">` is the
supported way to style a disabled link button; application code must also
prevent the click since `aria-disabled` does not stop navigation on its own.

```html demo
<div class="cluster">
  <button class="btn primary" type="button" disabled>Disabled</button>
  <button class="btn outline" type="button" disabled>Disabled outline</button>
  <a class="btn outline" href="#" aria-disabled="true">Disabled link</a>
</div>
```

### Loading

Set `aria-busy="true"` on the button and add a `.spinner`. The spinner inherits
the button size.

```html demo
<div class="cluster">
  <button class="btn primary" type="button" aria-busy="true" disabled>
    <span class="spinner" aria-hidden="true"></span>
    Saving…
  </button>
</div>
```

### Toggle

Use `aria-pressed` for toggle buttons. Actual styles the pressed state;
application code owns changing the attribute. The example scopes its script to
its own preview so repeated demos on a page cannot cross-bind.

```html demo
<div class="cluster">
  <button class="btn" type="button" aria-pressed="false">Bold</button>
  <button class="btn" type="button" aria-pressed="false">Italic</button>
</div>
<script>
  (() => {
    const preview = document.currentScript.closest(".docs-preview");
    for (const button of preview.querySelectorAll("button")) {
      button.addEventListener("click", () => {
        const pressed = button.getAttribute("aria-pressed") === "true";
        button.setAttribute("aria-pressed", String(!pressed));
      });
    }
  })();
</script>
```

For exclusive groups, manage a single pressed button:

```html demo
<div class="join" role="group" aria-label="Text alignment" data-docs-toggle-group>
  <button class="btn" type="button" aria-pressed="true">Left</button>
  <button class="btn outline" type="button" aria-pressed="false">Center</button>
  <button class="btn outline" type="button" aria-pressed="false">Right</button>
</div>
<script>
  (() => {
    const preview = document.currentScript.closest(".docs-preview");
    const group = preview.querySelector("[data-docs-toggle-group]");
    group.addEventListener("click", (event) => {
      const button = event.target.closest("button[aria-pressed]");
      if (!button || !group.contains(button)) return;
      for (const item of group.querySelectorAll("button[aria-pressed]")) {
        item.setAttribute("aria-pressed", String(item === button));
      }
    });
  })();
</script>
```

## Accessibility

- Always set `type="button"` when a button is not submitting a form.
- Use a real `<button>` for actions and `<a class="btn">` for navigation.
- Toggle buttons expose their state with `aria-pressed`; the component styles
  the pressed state but application code owns toggling the attribute.
- Disabled `<button>` and `<input>` use the native `disabled` attribute;
  disabled link buttons use `aria-disabled="true"` plus an app-side
  activation guard.

## CSS hooks

- `--btn-radius` — corner radius.
- `--btn-focus-color` — focus ring base color; the ring itself is derived from it.
- `--btn-gap` — space between an icon and the label text (default `0.375em`).
