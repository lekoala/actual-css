# Migrating from Tailwind CSS to Actual CSS

This guide primarily targets Tailwind CSS v4. The same migration principles apply to Tailwind v3 projects.

Tailwind and Actual CSS solve styling at different abstraction levels, so this should **not** be approached as a class-by-class conversion.

The useful migration model is:

**repeated utility clusters → Actual components**
**layout utility clusters → Actual layout primitives**
**design tokens → Actual theme tokens**
**one-off utility combinations → small project CSS**

If you finish the migration with a new `.mt-4`, `.flex`, `.bg-primary`, and `md:*` API built around Actual, you have recreated the framework you were trying to remove.

## Before you start: avoid class collisions

Tailwind and Actual can temporarily coexist, but some short class names overlap.

Examples include layout and flex-related names such as `.grid`, `.grow`, and `.items-center`.

For a staged migration, use cascade layers, controlled import order, or a project-side Actual prefix transform where necessary.

The layered import is the cleanest way to keep both stylesheets during the
migration:

```css
/* Migration setup — Actual rules sit in @layer actual */
@import "tailwind.css";        /* your compiled Tailwind output */
@import "actual-css/css/layer";
/* Unlayered project overrides stay on top */
@import "app.css";
```

`actual.layer.css` wraps every Actual rule in a single `@layer actual`, so
unlayered Tailwind output and project CSS keep precedence while the migration
runs. See [Cascade layer strategy](https://github.com/lekoala/actual-css/blob/master/docs/design-notes/cascade-layer.md) for the
limitations of the approach.

Do not assume that loading both complete stylesheets is automatically safe.

## Start with components, not utilities

A Tailwind button may look like this:

```html
<button
  class="
    inline-flex items-center gap-2
    rounded-md
    bg-blue-600 px-4 py-2
    font-medium text-white
    hover:bg-blue-700
    focus:outline-none focus:ring-2
  "
>
  Save
</button>
```

With Actual:

```html
<button class="btn primary">
  Save
</button>
```

The border, spacing, typography, hover state, focus treatment, disabled state, and theme behavior belong to the component.

The intent remains visible in the markup without re-describing its CSS implementation.

The same principle applies to badges, alerts, cards, form controls, pagination, tabs, dialogs, and other Actual components.

## Translate layout relationships

### Vertical spacing

Tailwind:

```html
<div class="flex flex-col gap-4">
  ...
</div>
```

Actual:

```html
<div class="stack">
  ...
</div>
```

### Inline actions

Tailwind:

```html
<div class="flex flex-wrap items-center gap-3">
  ...
</div>
```

Actual:

```html
<div class="cluster">
  ...
</div>
```

### Fixed column count

Tailwind:

```html
<div class="grid grid-cols-3 gap-6">
  ...
</div>
```

Actual:

```html
<div class="grid-3">
  ...
</div>
```

If the grid should respond to its container:

```html
<div class="container-query">
  <div class="grid-3">
    ...
  </div>
</div>
```

### Intrinsic responsive grid

Instead of:

```html
<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
```

consider whether the real requirement is simply “create another column whenever there is enough room”:

```html
<div class="grid" style="--grid-min: 16rem">
```

This removes viewport breakpoint choreography entirely.

## Prefer intrinsic behavior over translating breakpoints

Tailwind allows almost every utility to be changed independently at a breakpoint:

```html
<div class="flex flex-col gap-4 md:flex-row md:items-center xl:gap-8">
```

There is intentionally no equivalent Actual syntax such as:

```text
md:cluster xl:gap-lg
```

First ask what the layout is supposed to do.

If the requirement is:

> Show these items horizontally when there is enough room, otherwise stack them.

use a layout primitive such as `.switcher`.

If the requirement truly is:

> At exactly this application breakpoint, change these particular properties.

write project CSS:

```html
<div class="account-header">
  ...
</div>
```

```css
.account-header {
  display: grid;
  gap: var(--space-40);
}

@media (width >= 48rem) {
  .account-header {
    grid-template-columns: 1fr auto;
    align-items: center;
  }
}
```

Actual does not prohibit media queries. It simply does not encode every media query/property combination into the class API.

## Utility translation guide

| Tailwind usage                       | Actual approach                                   |
|--------------------------------------|---------------------------------------------------|
| `flex flex-col gap-*`                | `.stack`                                          |
| `flex flex-wrap items-center gap-*`  | `.cluster`                                        |
| `grid grid-cols-*`                   | `.grid`, `.grid-2`, `.grid-3`, etc.               |
| responsive row → column              | `.switcher` when intrinsic behavior fits          |
| `max-w-*` for readable text          | `.measure` where appropriate                      |
| common visual component bundle       | Actual component                                  |
| component colors                     | intents such as `.primary`, `.danger`, `.success` |
| repeated layout spacing              | `--gap` / layout hooks                            |
| small common corrections             | Actual utilities                                  |
| breakpoint-prefixed utilities        | intrinsic layout, container query, or project CSS |
| arbitrary values                     | custom property or project CSS                    |
| arbitrary selectors                  | project CSS                                       |
| `group-*` / `peer-*` variants        | semantic state + project CSS                      |
| `data-*` / `aria-*` variants         | component state or project CSS                    |
| decorative color utilities           | theme token or project CSS                        |
| transforms/effects/complex animation | project CSS                                       |

## Do not translate Tailwind's full spacing API

Tailwind makes it convenient to express:

```html
<div class="mt-3 mb-8 px-5 md:px-8">
```

Actual deliberately has a much smaller spacing utility surface.

Use layout primitives to create rhythm between siblings:

```html
<section class="stack">
  ...
</section>
```

Use component padding when the space belongs to the component.

Use a small semantic project rule when the spacing genuinely belongs to an application-specific structure:

```css
.account-section {
  padding-inline: var(--space-40);
  margin-block-end: var(--space-60);
}
```

The goal is not zero custom CSS. The goal is CSS attached to meaningful structures instead of reconstructing every declaration in HTML.

> **Need something more specific?**
>
> 1. Tune the component or layout primitive with a public custom property.
> 2. Compose an Actual layout primitive.
> 3. Add a project class for application-specific CSS.
> 4. Only reach for an optional utility when the rule is genuinely generic.

Actual deliberately keeps its utility surface small and grows it only for needs
that recur across real migrations — a one-off is project CSS, not a new
framework class.

## Arbitrary values move back into CSS

Tailwind can express one-off values directly:

```html
<div class="grid-cols-[24rem_2.5rem_minmax(0,1fr)]">
```

or:

```html
<div class="top-[117px]">
```

Actual has no equivalent arbitrary-value grammar.

Use a public layout hook when one exists:

```html
<div class="grid report-layout">
```

```css
.report-layout {
  --grid-columns: 24rem 2.5rem minmax(0, 1fr);
}
```

Otherwise write the declaration normally.

This is one of the largest mechanical differences for Tailwind-heavy applications.

## State variants move into component behavior or CSS

Tailwind can keep highly specific state rules in markup:

```html
<button
  class="
    bg-neutral-100
    hover:bg-neutral-200
    aria-pressed:bg-blue-600
    aria-pressed:text-white
    disabled:opacity-50
  "
>
```

For an Actual component, common interactive states should already be part of the component contract:

```html
<button class="btn primary" aria-pressed="true">
```

For application-specific state styling, keep the semantic attribute and style it directly:

```css
.view-toggle[aria-pressed="true"] {
  /* project-specific state */
}
```

The same applies to Tailwind's `group-*`, `peer-*`, arbitrary selector, and complex `data-*` variants.

Do not invent an Actual variant grammar to replace them.

## Colors and dark mode

Tailwind makes low-level color selection easy:

```html
<div class="bg-slate-950 text-slate-100 border-slate-800">
```

Actual's intent classes are not a general-purpose color palette.

Use intents where color has component meaning:

```html
<div class="alert danger">...</div>
```

For application surfaces, define theme-aware project tokens instead:

```css
:root {
  --dashboard-surface: ...;
  --dashboard-border: ...;
}

.dashboard-panel {
  background: var(--dashboard-surface);
  border-color: var(--dashboard-border);
}
```

Actual theme tokens should handle shared theme behavior. Local CSS remains appropriate for visual concepts that are specific to the application.

This is particularly important when migrating a Tailwind application with a large custom color palette.

## Forms

Tailwind applications often construct form controls from utility combinations or use an additional forms plugin.

Actual provides explicit form components:

```html
<label class="field">
  <span class="field-label">Email</span>
  <input class="input" type="email">
  <span class="field-help">We'll only use this for notifications.</span>
</label>
```

A utility-heavy form is therefore usually easier to migrate than a utility-heavy marketing layout.

## Third-party Tailwind components

This can be a significant migration cost.

A React, Vue, Svelte, or template component containing dozens of Tailwind classes does not become framework-independent merely because those classes are hidden behind a component abstraction.

For each component:

1. identify whether an Actual component already provides the UI primitive;
2. replace the utility bundle with that component when possible;
3. preserve application-specific styling in a local component class;
4. keep existing application behavior unless an Actual enhancement can replace it cleanly.

Third-party component libraries authored specifically around Tailwind usually require restyling rather than automated class substitution.

## Build pipeline

Once the last Tailwind classes are gone, the Tailwind compilation and source scanning pipeline is no longer required for Actual itself.

Actual can be imported as regular CSS, with modular imports when desired.

Do not remove Tailwind from the build until migrated screens no longer depend on generated utilities.

## Where migration is genuinely harder

| Existing Tailwind usage                            | Migration cost |
|----------------------------------------------------|----------------|
| buttons, badges, alerts, forms                     | low            |
| repeated card/panel patterns                       | low            |
| basic flex/grid composition                        | low to medium  |
| intrinsic responsive layouts                       | low to medium  |
| breakpoint-heavy layouts                           | medium to high |
| extensive arbitrary values                         | high           |
| `group`, `peer`, attribute, and arbitrary variants | high           |
| bespoke marketing/art-direction layouts            | high           |
| large application-specific color utility palette   | high           |
| Tailwind-native third-party component libraries    | high           |

This is not accidental.

Actual gives you components and layout primitives but deliberately stops before becoming a complete vocabulary for expressing arbitrary CSS from HTML.

## Recommended migration order

1. Establish safe coexistence while both stylesheets are present.
2. Find repeated Tailwind class bundles that already represent recognizable UI components.
3. Replace buttons, badges, alerts, cards, and forms with Actual components.
4. Convert simple flex layouts to `.stack` and `.cluster`.
5. Convert repeated grids to Actual grid primitives.
6. Replace useful breakpoint choreography with intrinsic layouts or container queries.
7. Move remaining arbitrary values and state variants into small project classes.
8. Migrate application theme values to Actual tokens and project tokens.
9. Remove unused Tailwind-dependent components.
10. Remove Tailwind and its build integration.

## When Tailwind may still be the better fit

Actual is not intended to make every Tailwind workflow equally convenient.

If your application deliberately wants:

* every styling decision colocated in markup;
* arbitrary per-element visual values;
* extensive responsive changes to individual properties;
* complex `group`, `peer`, and selector-driven state styling;
* highly bespoke visual composition with few repeated UI components;

then Tailwind's utility and variant model may remain a better fit.

If the application is mostly composed from recurring UI components, forms, application layouts, and a stable theme, Actual can substantially reduce the amount of styling information carried by the markup.
