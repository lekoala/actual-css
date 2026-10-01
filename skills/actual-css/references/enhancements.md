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

## Dialog anatomy

Treat `.modal` as the outer surface, not as its content layout. It deliberately
has no padding. Wrap modal content in a direct `<form>` or `.stack`; do not put
`.stack` on `dialog.modal` itself.

For a header band, put `<header>` directly under the dialog before the body
wrapper. Compose a flexible `.media` title region and a trailing `.cluster` of
controls. Nest `.close` in that cluster so it remains in flow; the title,
leading `.dialog-icon`, close, and any additional control then share one center
axis and the title uses the close control's minimum height. A direct
`dialog > header` is dialog chrome and forms a distinct band; put an ordinary
content heading in the wrapper's `<header>` instead.

For a corner close button, keep `.close` as a direct child of the dialog and put
the title in the content wrapper's direct `<header>`. The close button is then
anchored to the surface, and the header reserves room so the title cannot run
under it. A `.close` that is a direct child of the chrome header is that same
corner overlay, and that header reserves room for it too. Put actions in the
wrapper's `<footer>`.

Use `.bleed` on that direct header when it needs a contrasting full-width band;
the wrapper relays the modal padding so the band reaches the surface edges while
its contents keep the normal inset. A confirmation is composition, not a
variant: a `.media` row with a leading `.dialog-icon` and the text column (its
first heading centers on the icon, following copy stays in that column), then a
`<footer class="bleed background-subtle justify-content-space-between">` action
band with the cancel-style action first. For a trailing icon, use the wrapper's
direct header as a non-wrapping split `.cluster`, with `.grow` on the text
group. Do not compensate heading alignment with a literal margin.

Do not turn the dialog heading into an `.alert` to obtain icon or surface
styling. Compose `.dialog-icon` with `.media` for a leading title icon; reserve
`.alert` for a distinct status message in the dialog body. Inspect
`docs/pages/components/dialog.md` in the installed package for current recipes.

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
