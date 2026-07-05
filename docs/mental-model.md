# Mental model

## Components

Components are semantic boxes: `.btn`, `.badge`, `.alert`, `.card`, `.avatar`, etc. Each component owns its intrinsic layout and visual defaults.

## Intents

`.primary`, `.secondary`, `.success`, `.warning`, `.danger`, `.neutral` do not style elements directly. They only expose `--intent` and `--intent-fg`. Components and variants decide how to consume them.

```html
<button class="btn primary">Primary</button>
<span class="badge success">Success</span>
```

There is no `.btn-primary` or `.badge-success`. Intents are generic and reusable across any component that supports them.

## Variants

`.solid`, `.soft`, `.outline` define the visual treatment by setting `--ui-bg`, `--ui-fg`, `--ui-border` (and optionally `--ui-hover-bg`). Components consume these tokens with sensible fallbacks.

`.btn` and `.badge` default to `.solid`. `.alert` defaults to `.soft`.

`.ghost` and `.link` are button-only variants.

```html
<button class="btn soft primary">Soft primary</button>
<span class="badge outline success">Outline success</span>
<div class="alert solid warning">Solid warning</div>
```

## Sizes

`.sm` and `.lg` are contextual modifiers. They set inherited size tokens (`--control-size`, `--variant-font-size`, etc.) that components opt into.

```html
<div class="sm">
  <button class="btn">Small button</button>
  <span class="badge">Small badge</span>
</div>
```

Works locally too:

```html
<button class="btn sm">Small button</button>
<span class="badge lg">Large badge</span>
```

Components with bespoke sizing (`.avatar`, `.spinner`) define local `.sm`/`.lg` instead.

## Child semantics

When using a component, child elements follow the semantic pattern of that component. For example, `.avatar` accepts `<img>`, `<picture>`, text content, an empty `.badge` for status dots, and can be a `<button>` or `<a>`.

No child classes like `.avatar-img` are needed.

