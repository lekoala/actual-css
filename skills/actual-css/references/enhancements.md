# Enhancements and floating surfaces

## Four independent layers

```text
class          presentation
HTML / ARIA    semantics
data-enhance   root-controller behavior opt-in
data-*         feature configuration or leaf opt-in
```

A component may use all four, but they are not interchangeable.

Do not make CSS selectors depend on `data-enhance` or internal runtime transport markers.

## `data-enhance`

Use a token for a controller that owns a subtree. Verify current supported tokens from the installed version.

Self-describing leaf behavior should use the feature's own documented attribute, such as tooltip/filter/mask/context-menu attributes, rather than inventing an enhancement token.

Native `<dialog>` is semantically self-describing and does not need a generic enhancement token merely to be a dialog.

## Custom widgets

Before implementing lifecycle, focus, Escape handling, keyboard navigation, input rewriting, or floating-surface policy from scratch, inspect the exported Actual JS primitives.

Common responsibilities may already be covered by modules such as:

```text
enhance
surface
focus-group
keys
menu
focus
input
filter
events
command
```

Use the current package exports as the source of truth.

## One surface owner

A floating panel must have one lifecycle owner.

When Actual's runtime manages a surface, application code must not simultaneously own its Popover opening/closing or runtime positioning. Do not combine independent native/third-party lifecycle with Actual management on the same panel.

Actual-managed surfaces use top-layer transport while remaining in their authored DOM position. Do not reparent them to `body` to escape clipping; preserving inherited theme/density/custom-property context is part of the transport design.

## Flyout vs tooltip

Use a flyout or dialog for interactive floating content.

Tooltips are supplemental, non-interactive content. Use an explicit tooltip element when local inherited styling context matters; generated shorthand content may be created outside that local context.

Do not override positioning owned by the runtime.
