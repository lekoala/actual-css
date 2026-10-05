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

**A composition on a component takes over its default layout.** A component's
own layout sits at zero specificity, so `<article class="card media">` lays out
as a `.media` without an override, whatever the import order.

**State uses the most semantic attribute; classes choose presentation.**

| Kind             | Mechanism      | Examples                                     |
| ---------------- | -------------- | -------------------------------------------- |
| Native state     | HTML attribute | `disabled`, `open`, `checked`                |
| Accessible state | ARIA           | `aria-current`, `aria-expanded`, `aria-busy` |
| Runtime state    | `data-*`       | no native or ARIA equivalent                 |
| Presentation     | class          | `.soft`, `.outline`, `.sm`, `.compact`       |

Write `<a class="nav-link" aria-current="page">`, not `.nav-link.active`. The
few `.is-*` classes (`.is-open`, `.is-static`) are written by the runtime: never
author them in markup. `data-enhance` activates behavior and is never a styling
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
There is no `__` or `--` in Actual's names, because:

- **Modifiers are shared axes.** `.primary`, `.soft` and `.sm` mean the same
  thing on every component that supports them, so one class serves `.btn`,
  `.badge` and `.alert`. BEM names a modifier per block, which multiplies the
  vocabulary and keeps a custom intent such as `.tertiary` from working
  everywhere at once.
- **State is not a modifier.** `disabled`, `aria-current` and `open` already
  name the state; a `--disabled` or `--active` class would duplicate them and
  drift out of sync.
- **Elements come from HTML.** A card's `header` and `footer`, an avatar's
  `<img>` need no `__element` class; a prefixed class is kept for the parts
  HTML cannot name.

Application CSS can use any convention, BEM included, alongside Actual's
classes: `<article class="card pricing-plan pricing-plan--featured">`.

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
how tightly UI sits — spacing and component geometry — while font size and
icon size stay unchanged. `.tight` and `.loose` change the rhythm (`--gap`)
alone. Participation is opt-in, and a component only joins
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

The density tokens are `--gap`, `--density-space`, `--control-size`, and
`--control-pad-x`.
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
