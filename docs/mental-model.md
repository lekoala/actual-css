# Mental model

## Components

Components are semantic boxes: `.btn`, `.badge`, `.alert`, `.card`, `.avatar`, etc. Each component owns its intrinsic layout and visual defaults.

## Intents

`.primary`, `.secondary`, `.success`, `.warning`, `.danger` do not style elements directly. They only expose `--intent` and `--intent-fg`. Components and variants decide how to consume them.

```html
<button class="btn primary">Primary</button>
<span class="badge success">Success</span>
```

There is no `.btn-primary` or `.badge-success`. Intents are generic and reusable across any component that supports them.

Components fall back to their own default intent when no intent class is set. Buttons, badges, and alerts use the neutral palette (`--neutral` / `--neutral-fg`) by default.

Custom intents need no framework support — define `--intent` and `--intent-fg` on a class:

```css
.tertiary {
  --intent: var(--tertiary);
  --intent-fg: var(--tertiary-fg);
}
```

```html
<button class="btn tertiary">Tertiary</button>
<span class="badge tertiary">Tertiary</span>
```

## Variants

`.solid`, `.soft`, `.outline` define the visual treatment by setting `--ui-bg`, `--ui-fg`, `--ui-border` (and optionally `--ui-hover-bg`). Components consume these tokens with sensible fallbacks.

`.btn` and `.badge` default to `.solid`. `.alert` defaults to `.soft`.

`.ghost` and `.link` are button-only variants.

```html
<button class="btn soft primary">Soft primary</button>
<span class="badge outline success">Outline success</span>
<div class="alert solid warning">Solid warning</div>
```

## Density

`.sm` and `.lg` establish inherited density tokens. Density adjusts how much
space UI consumes — spacing and component geometry — not how large its content
is: typography and icon size never change. Components opt into the density
dimensions that make sense for them. The same modifiers can also be applied
directly to a component for local density.

As inherited contexts, one class tightens or loosens the whole subtree:

```html
<div class="sm">
  <button class="btn">Compact button</button>
  <input class="input">
  <span class="badge">Compact badge</span>
</div>
```

The same class on a component is local density, not a second meaning:

```html
<button class="btn sm">Compact button</button>
<span class="badge lg">Spacious badge</span>
```

This is not "`.sm` sometimes means density and sometimes size": `.sm` always
establishes the same density tokens — only the scope changes. The density
tokens are `--gap`, `--density-space`, `--control-size`, and
`--density-compact-size`. Components consume the dimensions that make sense
for them and opt out of the rest.

Components with bespoke sizing (`.avatar`, `.spinner`) define local `.sm`/`.lg`
instead of consuming the shared tokens.

## Child semantics

When using a component, child elements follow the semantic pattern of that component. For example, `.avatar` accepts `<img>`, `<picture>`, text content, an empty `.badge` for status dots, and can be a `<button>` or `<a>`.

No child classes like `.avatar-img` are needed.

