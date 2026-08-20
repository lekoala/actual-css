# Migrating from Bootstrap to Actual CSS

This guide targets Bootstrap 5.x. Actual CSS is not a drop-in Bootstrap replacement, but many Bootstrap concepts have direct or close equivalents.

The main migration is:

**Bootstrap components → Actual components**
**Bootstrap grid and utilities → Actual layout primitives + small project CSS**
**Bootstrap JavaScript plugins → native HTML + Actual enhancements**

## Before you start: running both frameworks

Actual CSS and Bootstrap both use short global class names such as `.btn`, `.card`, `.alert`, and `.table`.

Do not assume both complete stylesheets can be loaded side by side without interaction.

For an incremental migration, use one of these approaches:

* migrate isolated pages or application areas;
* control precedence with cascade layers or import order;
* use a project-side prefix transform for Actual while both frameworks coexist.

The layered import is the cleanest way to keep both stylesheets during the
migration:

```css
/* Migration setup — Actual rules sit in @layer actual */
@import "bootstrap.css";
@import "actual-css/css/layer";
/* Unlayered project overrides stay on top */
@import "app.css";
```

`actual.layer.css` wraps every Actual rule in a single `@layer actual`, so
unlayered Bootstrap and project CSS keep precedence while the migration runs.
See [Cascade layer strategy](https://github.com/lekoala/actual-css/blob/master/docs/design-notes/cascade-layer.md) for the
limitations of the approach.

Remove the compatibility mechanism when Bootstrap is gone. The public Actual API remains unprefixed.

## Components

Many common Bootstrap components translate directly.

| Bootstrap                  | Actual CSS              |
|----------------------------|-------------------------|
| `.btn .btn-primary`        | `.btn .primary`         |
| `.btn .btn-outline-danger` | `.btn .danger .outline` |
| `.btn .btn-sm`             | `.btn .sm`              |
| `.btn .btn-lg`             | `.btn .lg`              |
| `.badge`                   | `.badge`                |
| `.alert`                   | `.alert`                |
| `.card`                    | `.card`                 |
| `.table`                   | `.table`                |
| `.spinner-*`               | `.spinner`              |
| `.breadcrumb`              | `.breadcrumb`           |
| `.pagination`              | `.pagination`           |

Bootstrap commonly combines the intent with the component name:

```html
<button class="btn btn-primary btn-lg">Save</button>
```

Actual separates component, intent, variant, and size:

```html
<button class="btn primary lg">Save</button>
```

The same intent classes can be reused across compatible components:

```html
<button class="btn danger outline">Delete</button>
<span class="badge success soft">Active</span>
<div class="alert warning">Check these values.</div>
```

Do not mechanically translate every Bootstrap modifier. First check whether the distinction belongs to the component, the theme, or the surrounding layout.

## Forms

Bootstrap:

```html
<div class="mb-3">
  <label class="form-label" for="email">Email</label>
  <input class="form-control" id="email" type="email">
</div>
```

Actual:

```html
<label class="field">
  <span class="field-label">Email</span>
  <input class="input" type="email">
</label>
```

Common translations include:

| Bootstrap                     | Actual CSS                     |
|-------------------------------|--------------------------------|
| `.form-control` on an input   | `.input`                       |
| `.form-control` on a textarea | `.textarea`                    |
| `.form-select`                | `.select`                      |
| checkbox                      | `.check`                       |
| radio                         | `.radio`                       |
| `.form-switch`                | `.switch`                      |
| validation feedback           | `.field-error` / `.field-help` |
| grouped actions               | `.form-actions`                |

Actual uses explicit control classes instead of one generic `.form-control`.

Floating labels do not have a built-in Actual component. Keep them as project CSS if the design requires them.

## Replace rows and columns with layout intent

Bootstrap's twelve-column grid does not have a one-to-one equivalent.

A Bootstrap layout such as:

```html
<div class="row g-4">
  <div class="col-12 col-md-6">...</div>
  <div class="col-12 col-md-6">...</div>
</div>
```

usually becomes an Actual grid:

```html
<div class="grid" style="--grid-min: 18rem">
  <div>...</div>
  <div>...</div>
</div>
```

Or use the intrinsic grid when the real requirement is simply “fit as many useful columns as there is room for”:

```html
<div class="grid" style="--grid-min: 18rem">
  ...
</div>
```

For asymmetric layouts, express the layout directly:

```html
<div class="container-query">
  <div class="dashboard-grid grid">
    ...
  </div>
</div>
```

```css
.dashboard-grid {
  --grid-columns: minmax(0, 2fr) minmax(0, 1fr);
}

@container (width < 48rem) {
  .dashboard-grid {
    --grid-columns: 1fr;
  }
}
```

This is intentionally different from recreating `col-md-8 col-md-4`.

If your Bootstrap markup uses offsets, ordering, and several breakpoint-specific column widths, expect to write some project CSS during migration.

## Translate flex utility clusters into layout primitives

Bootstrap:

```html
<div class="d-flex align-items-center justify-content-between gap-3">
  ...
</div>
```

Actual:

```html
<div class="cluster">
  ...
</div>
```

Tune the primitive when necessary:

```html
<div
  class="cluster"
  style="--cluster-justify: space-between; --cluster-align: center"
>
  ...
</div>
```

For vertical flows:

```html
<div class="stack">
  ...
</div>
```

Think in terms of the relationship between children rather than translating each CSS declaration into another class.

Typical choices are:

| Bootstrap pattern                          | Actual approach                            |
|--------------------------------------------|--------------------------------------------|
| flex row that may wrap                     | `.cluster`                                 |
| vertical flex stack                        | `.stack`                                   |
| exact structural columns                   | `.grid-2`, `.grid-3`, `.grid-4`, `.grid-6` |
| intrinsically responsive cards             | `.grid`                                    |
| row that becomes a column when constrained | `.switcher`                                |
| sidebar/content layout                     | `.sidebar-layout`                          |
| readable centered content                  | `.center`, `.measure`                      |

## Do not recreate Bootstrap's utility API

Bootstrap offers responsive utilities for spacing, display, flexbox, visibility, sizing, and many other properties.

Actual deliberately does not provide an equivalent utility for every declaration.

For example:

```html
<div class="d-none d-lg-flex mt-4 px-3 text-end">
```

should not become a collection of newly invented Actual classes.

Keep Actual helpers for common composition needs and put application-specific behavior in project CSS:

```html
<div class="account-actions">
```

```css
.account-actions {
  display: none;
  margin-block-start: var(--space-40);
  padding-inline: var(--space-30);
  text-align: end;
}

@media (width >= 64rem) {
  .account-actions {
    display: flex;
  }
}
```

This is especially relevant for:

* breakpoint-specific display;
* responsive ordering;
* unusual widths and positioning;
* decorative text/background colors;
* one-off spacing combinations.

> **Need something more specific?**
>
> 1. Tune the component or layout primitive with a public custom property.
> 2. Compose an Actual layout primitive.
> 3. Add a project class for application-specific CSS.
> 4. Only reach for an optional utility when the rule is genuinely generic.

Actual deliberately keeps its utility surface small and grows it only for needs
that recur across real migrations — a one-off is project CSS, not a new
framework class.

## JavaScript components

Do not translate `data-bs-*` attributes mechanically. Actual generally starts from native platform behavior and adds enhancement only where useful.

### Modal

Bootstrap:

```html
<button
  data-bs-toggle="modal"
  data-bs-target="#settings"
>
  Settings
</button>
```

Actual:

```html
<button
  type="button"
  command="show-modal"
  commandfor="settings"
  aria-haspopup="dialog"
  aria-controls="settings"
>
  Settings
</button>

<dialog class="modal" id="settings">
  ...
</dialog>
```

### Offcanvas

Use a native dialog with the `.drawer` component.

```html
<button
  type="button"
  command="show-modal"
  commandfor="navigation"
  aria-haspopup="dialog"
  aria-controls="navigation"
>
  Menu
</button>

<dialog class="drawer" id="navigation">
  ...
</dialog>
```

### Dropdown

Bootstrap dropdowns normally migrate to an Actual flyout.

### Tabs

Bootstrap's tab plugin normally migrates to `.tabs` / `.tab` markup with the tabs enhancer.

### Tooltip and scrollspy

Actual provides dedicated enhancements for both.

The important difference is architectural: presentation classes and behavior are separate. `data-enhance` opts an element into Actual behavior instead of making every styled component implicitly dependent on a JavaScript plugin.

## Navbar migration

A Bootstrap responsive navbar often combines several responsibilities:

* horizontal navigation;
* breakpoint logic;
* collapse;
* toggler state;
* optionally offcanvas behavior.

Actual's navbar is intentionally a simpler navigation pattern.

Keep the desktop navigation as a navbar and compose the mobile experience from a
drawer or flyout rather than looking for a `.navbar-expand-lg` equivalent:

* desktop → `.navbar` with `.navbar-nav`;
* mobile → `.drawer` with `.nav-list`;
* trigger → a `command="show-modal"` / `commandfor` button.

The [Navbar component page](../components/navbar.md) shows this composition
as *the Actual way*: a horizontal `.navbar-nav` on the desktop bar and a vertical
`.nav-list` inside the mobile drawer, opened with the native dialog command
pattern. There is no collapse/toggler state to keep in sync.

This usually produces simpler behavior, but it is not a class-for-class migration.

## Components without a direct replacement

Do not expect complete Bootstrap widget parity.

For specialized widgets, first decide whether they are still needed, can use a native platform primitive, or should remain application code.

Examples that may require a different solution include:

* carousels;
* toast-style transient notifications;
* generic arbitrary collapse regions;
* Bootstrap-specific popover behavior.

A flyout may replace many popover-style interactive surfaces, but it is not intended as API compatibility with Bootstrap Popover.

## Themes and Sass customization

If your Bootstrap project mainly customizes Sass variables and theme maps, move stable design decisions into Actual theme tokens and public hooks.

Instead of generating additional framework classes such as:

```text
$theme-colors: map-merge(...);
```

prefer project tokens:

```css
:root {
  --primary: ...;
  --radius: ...;
}
```

and semantic project CSS where a value is application-specific.

Do not rebuild Bootstrap's generated utility matrix on top of Actual.

## Recommended migration order

1. Establish a safe coexistence strategy if both stylesheets must temporarily remain.
2. Migrate buttons, badges, alerts, cards, and basic content components.
3. Migrate forms.
4. Replace Bootstrap JavaScript widgets with native HTML and Actual enhancements.
5. Replace repeated flex utility clusters with layout primitives.
6. Migrate the Bootstrap grid.
7. Replace the remaining utility-heavy markup with small semantic project classes.
8. Remove Bootstrap and any temporary prefix or cascade compatibility layer.

## Where migration is genuinely harder

Expect additional work when the application relies heavily on:

* twelve-column grid arithmetic;
* offsets and breakpoint-specific ordering;
* extensive responsive utility combinations;
* Bootstrap navbar collapse behavior;
* floating labels — covered by the optional `.floating-field` module, so the
  cost is an import rather than a custom recipe;
* specialized Bootstrap JavaScript plugins;
* Sass-generated application utility classes.

Those are real migration costs, not syntax differences.

For component-oriented application UI, however, most Bootstrap usage maps naturally to Actual components, layouts, tokens, and enhancements.
