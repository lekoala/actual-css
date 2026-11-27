# Button

Actions and navigation with shared intents, variants, sizes, and loading, pressed, and disabled states.

```html demo
<div class="cluster">
  <button class="btn primary" type="button">Save changes</button>
  <button class="btn outline" type="button">Cancel</button>
</div>
```

## Usage

- Give one action per decision context the strongest treatment; two primary
  buttons in the same group compete. Use quieter treatments for alternatives,
  and reserve the `danger` intent for destructive actions.
- Name the action, with its object when it clarifies: “Save changes”,
  “Delete project”. Common actions such as “Close”, “Cancel” or “Done” stand
  alone. A label should still make sense read out of context.
- Keep a group to two or three actions; move the rest into an
  [action list](../enhancements/flyout.md#action-list).
- Let a long or translated label wrap to a second line rather than truncating
  it.

## Class reference

| Class         | Kind      | Description                                             |
| ------------- | --------- | ------------------------------------------------------- |
| `.btn`        | Component | Base button, solid by default.                          |
| `.primary`    | Intent    | Primary action.                                         |
| `.secondary`  | Intent    | Secondary action.                                       |
| `.success`    | Intent    | Positive outcome.                                       |
| `.warning`    | Intent    | Caution.                                                |
| `.danger`     | Intent    | Destructive action.                                     |
| `.neutral`    | Intent    | Neutral tone (the `.btn` default).                      |
| `.soft`       | Variant   | Muted intent-tinted surface.                            |
| `.outline`    | Variant   | Transparent with a control edge; an intent recolors it. |
| `.solid`      | Variant   | Filled intent background — the `.btn` default.          |
| `.surface`    | Variant   | Page surface, neutral border, intent on the label.      |
| `.ghost`      | Variant   | Borderless text button (button-only).                   |
| `.link`       | Variant   | Underlined text button (button-only).                   |
| `.sm` / `.lg` | Size      | Compact or large control height.                        |
| `.icon-only`  | Variant   | Square icon button sized to the control height.         |

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

`.ghost` and `.link` are button-only; `.soft`, `.outline`, `.solid`, and
`.surface` are shared with other components.

Reach for `.surface` when a secondary action must sit on an opaque, neutral
chip: `.outline` lets whatever is behind it show through, and `.soft` is the
intent-tinted treatment (its baseline fallback uses `--surface-subtle`).

None of the three gives an opaque fill *under* an intent-colored border —
`.surface` keeps the neutral `--border`, and `.outline` has no fill. Set
`--ui-bg` on the element for that combination; it is the variant relay every
component with shared variants reads, so the same declaration works on a badge:

```css
.chip-on-tint {
  --ui-bg: var(--surface);
}
```

The rule ties with the variant's own `--ui-bg` on specificity, so load it after
Actual CSS or import `actual.layer.css`.

Transparent treatments (`.outline`, `.ghost`, `.link`) take their text from the
surrounding foreground by default, including on a band your application paints.
A neutral outline draws its border with `--border`: its label identifies it, so
it needs no 3:1 control edge. Beside a field in a `.join`, it takes the field's
edge instead. Set `--ui-border` when the border must follow the band. A local intent class still
wins: `.danger.outline` uses the danger color in any context, and nothing tunes
that color for a surface you paint yourself. For intent ink on a dark band, use
a `data-theme` island, whose palette is tuned for its surface. Filled buttons
own their surface and keep their normal intent recipe.

A dark button (inverse, contrast) is a custom intent on the button itself, so
every variant keeps working — `.outline` and `.ghost` take the solid ink:

```css
.btn.app-dark {
  --intent: var(--surface-solid);
  --intent-fg: var(--surface-solid-fg);
}
```

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
  <button class="btn surface" type="button">Surface</button>
  <button class="btn danger surface" type="button">Danger surface</button>
  <button class="btn ghost" type="button">Ghost</button>
  <button class="btn link" type="button">Button as link</button>
</div>
```

### Icon and icon-only buttons

```html demo
<div class="cluster">
  <button class="btn primary" type="button">Create resource <i class="ti ti-plus" aria-hidden="true"></i></button>
  <button class="btn outline" type="button">Download report <i class="ti ti-download" aria-hidden="true"></i></button>
  <button class="btn ghost" type="button"><i class="ti ti-arrow-left" aria-hidden="true"></i> Back</button>
  <button class="btn icon-only" type="button" aria-label="Add">
    <i class="ti ti-plus" aria-hidden="true"></i>
  </button>
  <button class="btn primary icon-only" type="button" aria-label="Search">
    <i class="ti ti-search" aria-hidden="true"></i>
  </button>
</div>
```

Put the icon after the label by default: the action reads first. A direction
that points backward, such as “Back”, keeps its arrow before the label. In a
group, give every button an icon or none, and draw them in one icon style.
For a button as wide as its form column, see
[a full-width submit](../forms/form-actions.md#full-width-submit).

Use `.btn.icon-only` for a square icon button sized to the control height.
Always name it with an `aria-label` since there is no visible text; a
[tooltip](../enhancements/tooltip.md) shows that name to sighted users. Prefer
a visible label when the icon is not familiar or the action is destructive.

### Button groups

Join adjacent buttons with `.join`. The joined group is not a new component:
each button keeps its own classes, and `.join` only reshapes the outer corners
and collapses the shared edges.

```html demo
<div class="join" role="group" aria-label="Row actions">
  <button class="btn outline" type="button">Edit</button>
  <button class="btn outline" type="button">Duplicate</button>
  <button class="btn outline" type="button">Archive</button>
</div>
```

Name a button group with `role="group"` and a label; an input with one
attached button takes neither (see [joined controls](../forms/joined-controls.md)).

Use the same variant across a group. Change a button's variant to mark a
meaningful state, such as a solid pressed [toggle](#toggle) among outlines.
For one choice among a few on a shared track, use a
[segmented control](segmented.md).

Two buttons that settle one decision can share their width: a `.switcher`
gives them equal columns and stacks them when the row runs out of room. Keep
intrinsic widths everywhere else, such as a toolbar or a row with a ghost
“Skip”.

```html demo
<div class="switcher" style="--switcher-threshold: 20rem">
  <button class="btn outline" type="button">Keep location</button>
  <button class="btn danger" type="button">Delete location</button>
</div>
```

## Sizes

Prefer `.sm` and `.lg` over setting sizes directly. They scale control geometry
and typography together; `.compact` and `.spacious` only change density.

```html demo
<div class="cluster">
  <button class="btn sm" type="button">Small</button>
  <button class="btn" type="button">Regular</button>
  <button class="btn lg" type="button">Large</button>
</div>
```

### Label weight

A distinct `500` (medium) label needs a font face at that weight or a
variable font whose weight axis includes it. When `400` and `600` are the
nearest available weights, the browser renders `500` using `400`.

If the font stack lacks `500`, set `font-weight` on `.btn` in your theme.
Choose `400` (`--font-weight-normal`) for a quieter label or `600`
(`--font-weight-semibold`) for more emphasis.

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

Show loading on the button when that action is what the user is waiting for.
Set `aria-busy="true"` and add a `.spinner` beside a label that names the
operation. Use the form's [request state](../forms/ajax.md#request-state) for
an Ajax submit, or manage the busy state and repeat activation in application
code.

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

### Touch feedback

The reset sets `-webkit-tap-highlight-color: transparent` on `html`: the native
tap flash is a rectangle that ignores `--btn-radius`. A pressed button moves
down a pixel instead. A bare text link (`<a href>` with no class) has no
pressed state of its own, so it keeps a flash tinted from its own color. The
property inherits, so one declaration on a container restores the native flash
on its components. Tap both rows on a phone to compare:

```html demo
<div class="stack">
  <div class="cluster">
    <button class="btn primary" type="button" style="--btn-radius: var(--radius-full);">Default</button>
    <label class="choice-card chip"><input type="checkbox" /> Chip</label>
    <a href="#touch-feedback">Text link</a>
  </div>
  <div class="cluster" style="-webkit-tap-highlight-color: rgb(0 0 0 / 0.2);">
    <button class="btn primary" type="button" style="--btn-radius: var(--radius-full);">Native flash</button>
    <label class="choice-card chip"><input type="checkbox" /> Chip</label>
  </div>
</div>
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

- `--btn-font-size` — label size, one type step below the field text and
  selected by `.sm`/`.lg`. It inherits, so a container can set it for every
  button inside. `.btn.link` takes the surrounding text size and `.icon-only`
  the field text size instead.
- `--btn-radius` — corner radius of every button, variants included; set it on a theme or region.
  Unset, `.link` keeps a smaller corner.
- `--btn-gap` — space between an icon and the label text (default `0.375em`).
- `--btn-shadow` — resting elevation (unset by default). It inherits, so a
  theme can set it once on its root; the solid hover overlay composes with it.
  Change it in `:hover`/`:active` rules for a lift and press.
  Supply shadow-list items; use `0 0 #0000` for no elevation. `none` cannot
  compose with the inset hover overlay and invalidates the whole shadow list.
- Solid buttons paint the [`--finish`](../foundations/tokens.md#finish) token
  over their fill, and the hover darkens both. `.outline`, `.ghost`, `.link`,
  `.soft` and `.surface` stay flat.
