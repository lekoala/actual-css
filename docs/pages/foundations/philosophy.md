# Philosophy

How components, intents, variants, and density compose — and what each layer is responsible for.

## Components

Components are semantic boxes: `.btn`, `.badge`, `.alert`, `.card`, `.avatar`, etc. Each component owns its intrinsic layout and visual defaults.

## Intents

`.primary`, `.secondary`, `.success`, `.warning`, `.danger` do not style elements directly. They only expose `--intent` and `--intent-fg`. Components and variants decide how to consume them.

Intent classes define the current `--intent` value; they do not form a
general-purpose color utility system. Use `.intent-color` when a simple element
should consume the current intent as its foreground color. It works with an
intent on the same element or inherited from an ancestor.

```html demo
<button class="btn primary">Primary</button>
<span class="badge success">Success</span>
<span class="success intent-color">Success text</span>
<span class="danger">
  <i class="ti ti-alert-triangle intent-color" aria-hidden="true"></i>
  Something needs attention
</span>
```

There is no `.btn-primary` or `.badge-success`. Intents are generic and reusable across any component that supports them.

Components fall back to their own default intent when no intent class is set. Buttons, badges, and alerts use the neutral palette (`--neutral` / `--neutral-fg`) by default.

Custom intents need no framework support — define `--intent` and `--intent-fg`
(and `--intent-soft-fg` when the custom role needs its own soft foreground) on a
class:

```css
.tertiary {
  --intent: var(--tertiary);
  --intent-fg: var(--tertiary-fg);
  --intent-soft-fg: var(--tertiary-soft-fg);
}
```

```html demo
<button class="btn tertiary">Tertiary</button>
<span class="badge tertiary">Tertiary</span>
```

## Variants

`.solid`, `.soft`, `.outline`, `.surface` define the visual treatment by setting `--ui-bg`, `--ui-fg`, `--ui-border`. Components consume these tokens with sensible fallbacks. Interactive components also set a `--ui-hover-bg` recipe that their hover rule reads.

`.btn` defaults to `.solid`; `.badge` and `.alert` default to `.soft`.

`.ghost` and `.link` are button-only variants.

```html demo
<div class="stack">
  <div class="cluster">
    <button class="btn soft primary">Soft primary</button>
    <span class="badge outline success">Outline success</span>
  </div>
  <div class="alert solid warning">Solid warning</div>
</div>
```

## Size and density

`.sm` and `.lg` mean one size role below or above a component's natural size.
Size names are shared roles, not shared measurements. Each participating
component family maps them to its own optical scale: badges use `xs / sm / md`,
while controls use `sm / md / lg`. Components without an explicit mapping do
not change.

A size role is applied to the component that participates in the scale and
never styles arbitrary descendants. It propagates through token inheritance,
though: components in the shared control scale set local `--control-size` and
`--control-font-size`, and descendants consume them by their own rules. That is
how `.field sm`, `.input-icon sm`, `.join sm`, and `.flyout sm` size the
controls inside them, while a bare `.sm` on a plain element does nothing.

`.compact` and `.spacious` establish inherited density tokens. Density arranges
how tightly UI sits — spacing and component geometry — while typography and
icon size stay unchanged. Participation is opt-in, and a component only joins
where density has an effect independent from its optical size: if the result is
merely that the component looks smaller or larger, that is size, not density.

Density participation takes three levels:

- **Geometry + rhythm** — controls and their wrappers (`.field`, `.join`,
  `.flyout`, …). Height, padding, and gap respond; typography is untouched.
- **Rhythm only** — content rows and shells such as `.list`. Spacing tightens
  (`--list-item-gap: var(--gap)`), but the structural size stays stable.
- **No density effect** — components whose geometry is intrinsic to their
  content (`.badge`, `.avatar`, `.spinner`, `.rating`, `.key`, prose, inline
  `.choice`/`.switch`). Their optical size belongs to `sm`/`lg` or local hooks.

As inherited contexts, one class tightens or loosens the whole subtree:

```html demo
<div class="compact stack">
  <button class="btn">Compact button</button>
  <input class="input">
  <span class="badge">Compact badge</span>
</div>
```

Application chrome can use the same scope:

```html demo
<header class="navbar compact">
  <a class="navbar-brand" href="/">Workspace</a>
  <nav class="cluster" aria-label="Workspace actions">
    <button class="btn ghost">Search</button>
    <button class="btn primary">Create</button>
  </nav>
</header>
```

Component geometry remains local and wins over inherited density when both
affect the same dimension:

```html demo
<div class="compact">
  <button class="btn lg">Large button in a compact context</button>
</div>
```

The density tokens are `--gap`, `--density-space`, and `--control-size`.
Components consume the dimensions that make sense for them and opt out of the
rest. The absolute `--space-*` scale is not rebound by density scopes.
Components with bespoke geometry (`.badge`, `.avatar`,
`.spinner`, `.rating`) own their local `.sm`/`.lg` mappings.

`.compact` also remains a meaningful local modifier for `.card` and `.table`.
On those components it tightens their own padding and establishes the compact
density context for descendants.

## Child semantics

When using a component, child elements follow the semantic pattern of that component. For example, `.avatar` accepts `<img>`, `<picture>`, text content, an empty `.badge` for status dots, and can be a `<button>` or `<a>`.

No child classes like `.avatar-img` are needed.
