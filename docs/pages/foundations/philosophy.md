# Philosophy

Actual CSS is a composition-first component framework: let HTML and the
cascade do the work, compose layout separately from components, and add an
abstraction only for a real, repeated need. The outlook is close to
[CUBE CSS](https://cube.fyi/), without adopting its methodology or naming.

**Related terms:** principles, architecture, CUBE, BEM, naming, methodology, guidelines.

## Layers

| Layer     | In Actual                         | Owns                                |
| --------- | --------------------------------- | ----------------------------------- |
| Baseline  | reset, tokens, themes, base       | HTML defaults, cascade, inheritance |
| Layout    | `.stack`, `.cluster`, `.grid`, …  | space between children              |
| Utility   | `.list-reset`, `.measure`, …      | one reusable adjustment             |
| Component | `.card`, `.btn`, form controls, … | intrinsic anatomy and appearance    |
| State     | native attributes, ARIA, `data-*` | what the element is doing           |

## Principles

**Components own their inside; compositions own the space between them.** A
card sets its padding, surface and slots. Where it sits, and how far it is from
the next card, belongs to the layout around it:

```html
<section class="stack">
  <article class="card">…</article>
  <article class="card">…</article>
</section>
```

A rule such as `.card + .card { margin-block-start: 2rem }` moves page layout
into the component; put a composition around the cards instead.

**A layout primitive replaces the component's default layout.** For example,
`<article class="card media">` keeps the card's appearance and uses `.media`
for its layout.

**State uses the most semantic attribute; classes choose presentation.**

| Kind             | Mechanism      | Examples                                     |
| ---------------- | -------------- | -------------------------------------------- |
| Native state     | HTML attribute | `disabled`, `open`, `checked`                |
| Accessible state | ARIA           | `aria-current`, `aria-expanded`, `aria-busy` |
| Runtime state    | `data-*`       | no native or ARIA equivalent                 |
| Presentation     | class          | `.soft`, `.outline`, `.sm`, `.compact`       |

Write `<a class="nav-link" aria-current="page">`, not `.nav-link.active`. The
few `.is-*` classes (`.is-open`, `.is-static`) are runtime internals: neither
set nor select them. `data-enhance` activates behavior and is never a styling
hook.

**A utility does one thing.** A class that sets a surface, a border, padding and
type together is a component: give it a name in application CSS.

**Configure before overriding.** Documented public hooks (`--grid-min`,
`--card-pad`, `--cluster-justify`) are the API. Other custom properties are
internal and may change.

## Before adding CSS

Go down the layers and stop at the first that answers the need:

1. Does HTML already express it, or the browser already do it?
2. Is it a relationship between children? Use a composition.
3. Is it one small adjustment? Use a utility.
4. Is it the anatomy of a component? Use the component and its hooks.
5. Is it a state of that component? Use the attribute that names the state.

What remains is product-specific: write it as application CSS, as described in
[Building with Actual CSS](../guides/integrating-actual-css.md).

## Class grammar

A component takes optional intent, variant and size classes:
`<button class="btn primary soft sm">`. The sections below describe each axis.

### Flat names, not BEM

A modifier is a separate class that combines with others (`.btn.primary.soft`,
not `.btn--primary`), and a part gets a prefixed class (`.alert-icon`,
`.list-item-title`) only when its element does not already say what it is.

Application CSS can use any convention, BEM included, alongside Actual's
classes: `<article class="card pricing-plan pricing-plan--featured">`.

## Components

Components are semantic boxes: `.btn`, `.badge`, `.alert`, `.card`, `.avatar`, etc. Each component owns its intrinsic layout and visual defaults.

Components are replaceable implementations. If a built-in component does more
than your application needs, omit its module and write your own. Keep the
semantic markup, state conventions, and shared design tokens where they fit.
See [Replace a component, keep the conventions](../guides/modular-import.md#replace-a-component-keep-the-conventions)
for a minimal Steps implementation.

## Intents

`.primary`, `.secondary`, `.success`, `.warning`, and `.danger` choose a color
role. The component and variant decide how to display it.

For plain text or an icon, add `.intent-color` to use the intent as its text
color. The intent can be on that element or an ancestor.

```html demo
<button class="btn primary">Primary</button>
<span class="badge success">Success</span>
<span class="success intent-color">Success text</span>
<span class="danger">
  <i class="ti ti-alert-triangle intent-color" aria-hidden="true"></i>
  Something needs attention
</span>
```

Without an intent class, components use their own default palette.

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

`.solid`, `.soft`, `.outline`, and `.surface` choose the visual treatment:
filled, tinted, outlined, or on the page surface.

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

- **Size:** `.sm` and `.lg` change a component's text and geometry. Each
  component has its own scale; the same size name does not mean the same
  dimensions everywhere.
- **Density:** `.compact` and `.spacious` change spacing and control geometry
  throughout a region, keeping text and icons at the same size.
- **Rhythm:** `.tight` and `.loose` change only the inherited gap.

Apply size to a supported component or control wrapper. For example,
`.field sm`, `.input-icon sm`, `.join sm`, and `.flyout sm` size the controls
inside them. `.sm` on a plain element has no effect.

Density affects controls and layout spacing. Badges, avatars, spinners,
ratings, keys, prose, and inline choices keep their own size. One density
class applies to the whole subtree:

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

Density leaves the absolute `--space-*` scale unchanged. See
[Control tokens](tokens.md#controls) to customize the shared scale.

`.compact` also remains a meaningful local modifier for `.card` and `.table`.
On those components it tightens their own padding and establishes the compact
density context for descendants.

## Child semantics

When using a component, child elements follow the semantic pattern of that component. For example, `.avatar` accepts `<img>`, `<picture>`, text content, an empty `.badge` for status dots, and can be a `<button>` or `<a>`.

No child classes like `.avatar-img` are needed.
