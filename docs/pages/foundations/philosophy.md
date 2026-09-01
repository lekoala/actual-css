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

Custom intents need no framework support — define `--intent` and `--intent-fg` on a class:

```css
.tertiary {
  --intent: var(--tertiary);
  --intent-fg: var(--tertiary-fg);
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

```html demo
<div class="sm">
  <button class="btn">Compact button</button>
  <input class="input">
  <span class="badge">Compact badge</span>
</div>
```

The same class on a component is local density, not a second meaning:

```html demo
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
